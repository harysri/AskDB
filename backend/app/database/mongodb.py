"""
MongoDB Atlas connection management.

Stores:
  - sessions: one document per user chat session (metadata + connection ref)
  - chat_messages: persistent chat history per session
  - db_schemas: cached introspected schema per connection (for schema awareness)
  - db_connections: encrypted connection credentials per user/session
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MongoManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongo_manager = MongoManager()


async def connect_to_mongo() -> None:
    settings = get_settings()
    mongo_manager.client = AsyncIOMotorClient(settings.mongodb_uri)
    mongo_manager.db = mongo_manager.client[settings.mongodb_db_name]

    # Fail fast on startup if Atlas is unreachable.
    await mongo_manager.client.admin.command("ping")
    logger.info("Connected to MongoDB Atlas (db=%s)", settings.mongodb_db_name)

    await _ensure_indexes()


async def close_mongo_connection() -> None:
    if mongo_manager.client:
        mongo_manager.client.close()
        logger.info("Closed MongoDB connection")


async def _ensure_indexes() -> None:
    db = mongo_manager.db
    assert db is not None

    await db.sessions.create_index([("user_id", 1), ("updated_at", -1)])
    await db.sessions.create_index("session_id", unique=True)

    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])

    await db.db_schemas.create_index("connection_id", unique=True)
    await db.db_schemas.create_index("cached_at")

    await db.db_connections.create_index([("user_id", 1), ("created_at", -1)])
    await db.db_connections.create_index("connection_id", unique=True)

    logger.info("MongoDB indexes ensured")


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency-friendly accessor for the active database handle."""
    if mongo_manager.db is None:
        raise RuntimeError("MongoDB has not been initialized yet")
    return mongo_manager.db
