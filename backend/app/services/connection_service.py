from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.sql_connector import dispose_engine, test_connection, verify_read_only
from app.models.schema import ConnectionDocument, ConnectionRequest
from app.utils.crypto import encrypt_value


async def create_connection(
    db: AsyncIOMotorDatabase, user_id: str, request: ConnectionRequest
) -> tuple[ConnectionDocument, bool, str]:
    """Creates (and tests) a new database connection. Returns the document
    plus the read-only verification result.

    When `save_credentials` is True the connection is persisted (deduplicated
    by target so re-connecting to the same DB reuses the same connection_id),
    but only after it has verified as read-only.
    """

    connection = ConnectionDocument(
        user_id=user_id,
        db_type=request.db_type,
        host=request.host,
        port=request.port,
        database=request.database,
        username=request.username,
        encrypted_password=encrypt_value(request.password),
    )

    if request.save_credentials:
        existing = await db.db_connections.find_one(
            {
                "user_id": user_id,
                "db_type": request.db_type,
                "host": request.host,
                "database": request.database,
                "username": request.username,
            }
        )
        if existing:
            connection = ConnectionDocument(**existing)
            connection.encrypted_password = encrypt_value(request.password)

    success, message, _ = test_connection(connection)
    if not success:
        return connection, False, message

    is_read_only, ro_message = verify_read_only(connection)
    connection.is_read_only_verified = is_read_only

    if request.save_credentials and is_read_only:
        await db.db_connections.update_one(
            {"connection_id": connection.connection_id},
            {"$set": connection.model_dump()},
            upsert=True,
        )

    return connection, is_read_only, ro_message


async def list_connections(
    db: AsyncIOMotorDatabase, user_id: str
) -> list[ConnectionDocument]:
    cursor = db.db_connections.find({"user_id": user_id}).sort("last_used_at", -1)
    return [ConnectionDocument(**doc) async for doc in cursor]


async def get_connection(
    db: AsyncIOMotorDatabase, connection_id: str, user_id: str
) -> ConnectionDocument | None:
    doc = await db.db_connections.find_one({"connection_id": connection_id, "user_id": user_id})
    return ConnectionDocument(**doc) if doc else None


async def touch_connection(db: AsyncIOMotorDatabase, connection_id: str) -> None:
    await db.db_connections.update_one(
        {"connection_id": connection_id}, {"$set": {"last_used_at": datetime.now(timezone.utc)}}
    )


async def delete_connection(db: AsyncIOMotorDatabase, connection_id: str, user_id: str) -> bool:
    result = await db.db_connections.delete_one({"connection_id": connection_id, "user_id": user_id})
    dispose_engine(connection_id)
    return result.deleted_count > 0
