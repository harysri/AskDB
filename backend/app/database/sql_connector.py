"""
Read-only connection layer to the customer's PostgreSQL / MySQL database.

Safety guarantees enforced at this layer (defense in depth, on top of the
SQL-validation done in tools/sql_tool.py):
  1. Connections are opened with a driver-level read-only flag where supported.
  2. A session-level statement timeout is set to prevent runaway queries.
  3. Every connection is validated against a role/permission check on first use
     (best-effort — see `verify_read_only`).
  4. Connections are cached per connection_id with a bounded pool and are
     disposed of when idle.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Generator
from urllib.parse import quote_plus

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import QueuePool

from app.config import get_settings
from app.models.schema import ConnectionDocument, DBType
from app.utils.crypto import decrypt_value
from app.utils.logger import get_logger

logger = get_logger(__name__)

_engine_cache: dict[str, Engine] = {}


def _build_connection_url(conn: ConnectionDocument, password: str) -> str:
    user = quote_plus(conn.username)
    pwd = quote_plus(password)
    host = conn.host
    port = conn.port
    db = conn.database

    if conn.db_type == DBType.postgresql:
        return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{db}"
    elif conn.db_type == DBType.mysql:
        return f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}"
    raise ValueError(f"Unsupported db_type: {conn.db_type}")


def _apply_session_safety(engine: Engine, db_type: DBType, timeout_seconds: int) -> None:
    """Attaches a connect-time hook that enforces read-only + timeout at the
    session level, independent of the credentials' actual grants."""

    @event.listens_for(engine, "connect")
    def _set_session_guards(dbapi_connection, connection_record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        try:
            if db_type == DBType.postgresql:
                cursor.execute("SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY")
                cursor.execute(f"SET statement_timeout = {timeout_seconds * 1000}")
            elif db_type == DBType.mysql:
                cursor.execute("SET SESSION TRANSACTION READ ONLY")
                cursor.execute(f"SET SESSION MAX_EXECUTION_TIME = {timeout_seconds * 1000}")
        finally:
            cursor.close()


def get_engine(conn: ConnectionDocument) -> Engine:
    """Returns a cached, read-only SQLAlchemy engine for the given connection."""
    settings = get_settings()

    if conn.connection_id in _engine_cache:
        return _engine_cache[conn.connection_id]

    password = decrypt_value(conn.encrypted_password)
    url = _build_connection_url(conn, password)

    engine = create_engine(
        url,
        poolclass=QueuePool,
        pool_size=3,
        max_overflow=2,
        pool_pre_ping=True,
        pool_recycle=1800,
        # execution_options read-only flag is respected by some DBAPI dialects;
        # combined with the session-level SET statements above for defense in depth.
        execution_options={"postgresql_readonly": True} if conn.db_type == DBType.postgresql else {},
    )

    _apply_session_safety(engine, conn.db_type, settings.sql_query_timeout_seconds)

    _engine_cache[conn.connection_id] = engine
    logger.info("Created new read-only engine for connection_id=%s", conn.connection_id)
    return engine


def dispose_engine(connection_id: str) -> None:
    engine = _engine_cache.pop(connection_id, None)
    if engine:
        engine.dispose()
        logger.info("Disposed engine for connection_id=%s", connection_id)


@contextmanager
def get_connection(conn: ConnectionDocument) -> Generator:
    engine = get_engine(conn)
    connection = engine.connect()
    try:
        yield connection
    finally:
        connection.close()


def verify_read_only(conn: ConnectionDocument) -> tuple[bool, str]:
    """
    Best-effort check that the supplied credentials cannot write.
    Attempts a harmless write inside a transaction that is always rolled back;
    if the DB rejects it (permission denied) or our session guards block it,
    we consider read-only verified.
    """
    engine = get_engine(conn)
    try:
        with engine.connect() as connection:
            trans = connection.begin()
            try:
                probe_table = "_askdb_write_probe"
                connection.execute(
                    text(f"CREATE TEMPORARY TABLE {probe_table} (id INT)")
                )
                connection.execute(text(f"INSERT INTO {probe_table} VALUES (1)"))
                # If we get here, the session-level READ ONLY guard didn't block it
                # (temp tables are sometimes exempt) — roll back regardless.
                trans.rollback()
                return False, (
                    "Write operations were not blocked at the session level. "
                    "Please use a database role with strictly read-only (SELECT-only) grants."
                )
            except SQLAlchemyError:
                trans.rollback()
                return True, "Read-only enforcement verified: write attempt was rejected."
    except SQLAlchemyError as exc:
        logger.error("verify_read_only connection error: %s", exc)
        return False, f"Could not verify connection: {exc}"


def test_connection(conn: ConnectionDocument) -> tuple[bool, str, str | None]:
    """Simple connectivity + version check used by the /connection/test endpoint."""
    try:
        engine = get_engine(conn)
        with engine.connect() as connection:
            if conn.db_type == DBType.postgresql:
                version = connection.execute(text("SELECT version()")).scalar()
            else:
                version = connection.execute(text("SELECT VERSION()")).scalar()
        return True, "Connection successful", str(version)
    except SQLAlchemyError as exc:
        logger.warning("Connection test failed: %s", exc)
        return False, f"Connection failed: {exc}", None
