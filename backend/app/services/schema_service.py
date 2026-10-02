"""
Introspects the connected customer database and caches a compact schema
representation in MongoDB, so the LLM agents get automatic schema
awareness without re-querying information_schema every turn.
"""
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy import inspect

from app.database.sql_connector import get_engine
from app.models.schema import ColumnInfo, ConnectionDocument, SchemaDocument, TableInfo
from app.utils.logger import get_logger

logger = get_logger(__name__)

SCHEMA_CACHE_TTL = timedelta(hours=6)


async def get_or_refresh_schema(
    db: AsyncIOMotorDatabase, conn: ConnectionDocument, force_refresh: bool = False
) -> SchemaDocument:
    cached = await db.db_schemas.find_one({"connection_id": conn.connection_id})

    if cached and not force_refresh:
        cached_at = cached["cached_at"]
        if cached_at.tzinfo is None:
            cached_at = cached_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - cached_at < SCHEMA_CACHE_TTL:
            return SchemaDocument(**cached)

    schema_doc = _introspect_schema(conn)
    await db.db_schemas.update_one(
        {"connection_id": conn.connection_id},
        {"$set": schema_doc.model_dump()},
        upsert=True,
    )
    logger.info(
        "Refreshed schema cache for connection_id=%s (%d tables)",
        conn.connection_id,
        len(schema_doc.tables),
    )
    return schema_doc


def _introspect_schema(conn: ConnectionDocument) -> SchemaDocument:
    engine = get_engine(conn)
    inspector = inspect(engine)

    tables: list[TableInfo] = []
    for table_name in inspector.get_table_names():
        pk_columns = set(inspector.get_pk_constraint(table_name).get("constrained_columns", []))

        fk_map: dict[str, str] = {}
        for fk in inspector.get_foreign_keys(table_name):
            referred_table = fk.get("referred_table")
            referred_cols = fk.get("referred_columns", [])
            for local_col, remote_col in zip(fk.get("constrained_columns", []), referred_cols):
                fk_map[local_col] = f"{referred_table}.{remote_col}"

        columns = [
            ColumnInfo(
                name=col["name"],
                type=str(col["type"]),
                nullable=col.get("nullable", True),
                is_primary_key=col["name"] in pk_columns,
                is_foreign_key=col["name"] in fk_map,
                references=fk_map.get(col["name"]),
            )
            for col in inspector.get_columns(table_name)
        ]

        row_count_estimate = None
        try:
            row_count_estimate = _estimate_row_count(engine, table_name)
        except Exception:  # noqa: BLE001 - estimation is best-effort only
            pass

        tables.append(
            TableInfo(name=table_name, columns=columns, row_count_estimate=row_count_estimate)
        )

    return SchemaDocument(
        connection_id=conn.connection_id,
        database_name=conn.database,
        tables=tables,
    )


def _estimate_row_count(engine, table_name: str) -> int | None:
    from sqlalchemy import text

    with engine.connect() as connection:
        try:
            result = connection.execute(
                text(f'SELECT COUNT(*) FROM "{table_name}" LIMIT 1')
            ).scalar()
            return int(result) if result is not None else None
        except Exception:  # noqa: BLE001
            return None
