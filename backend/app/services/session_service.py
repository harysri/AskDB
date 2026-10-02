from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.chat import ChatMessageDocument, MessageRole, MessageType
from app.models.session import SessionDocument


async def create_session(db: AsyncIOMotorDatabase, user_id: str, connection_id: str | None = None) -> SessionDocument:
    session = SessionDocument(user_id=user_id, connection_id=connection_id)
    await db.sessions.insert_one(session.model_dump())
    return session


async def get_session(db: AsyncIOMotorDatabase, session_id: str, user_id: str) -> SessionDocument | None:
    doc = await db.sessions.find_one({"session_id": session_id, "user_id": user_id})
    return SessionDocument(**doc) if doc else None


async def list_sessions(db: AsyncIOMotorDatabase, user_id: str, include_archived: bool = False) -> list[SessionDocument]:
    query: dict = {"user_id": user_id}
    if not include_archived:
        query["is_archived"] = False

    cursor = db.sessions.find(query).sort("updated_at", -1)
    return [SessionDocument(**doc) async for doc in cursor]


async def update_session(
    db: AsyncIOMotorDatabase,
    session_id: str,
    user_id: str,
    title: str | None = None,
    is_archived: bool | None = None,
    connection_id: str | None = None,
) -> None:
    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}
    if title is not None:
        update_fields["title"] = title
    if is_archived is not None:
        update_fields["is_archived"] = is_archived
    if connection_id is not None:
        update_fields["connection_id"] = connection_id

    await db.sessions.update_one(
        {"session_id": session_id, "user_id": user_id}, {"$set": update_fields}
    )


async def touch_session(db: AsyncIOMotorDatabase, session_id: str, increment_messages: int = 0) -> None:
    await db.sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {"updated_at": datetime.now(timezone.utc)},
            "$inc": {"message_count": increment_messages},
        },
    )


async def auto_title_session_if_needed(db: AsyncIOMotorDatabase, session_id: str, user_id: str, first_message: str) -> None:
    session = await get_session(db, session_id, user_id)
    if session and session.title == "New Session":
        title = first_message[:60] + ("..." if len(first_message) > 60 else "")
        await update_session(db, session_id, user_id, title=title)


async def delete_session(db: AsyncIOMotorDatabase, session_id: str, user_id: str) -> bool:
    """Deletes a session and its chat history. Scoped to the owner.

    Returns True if a session was deleted, False if it did not exist or was
    not owned by this user.
    """
    result = await db.sessions.delete_one({"session_id": session_id, "user_id": user_id})
    if result.deleted_count == 0:
        return False
    await db.chat_messages.delete_many({"session_id": session_id})
    return True


async def save_message(db: AsyncIOMotorDatabase, message: ChatMessageDocument) -> None:
    await db.chat_messages.insert_one(message.model_dump())


async def get_chat_history(
    db: AsyncIOMotorDatabase, session_id: str, limit: int = 50
) -> list[ChatMessageDocument]:
    cursor = db.chat_messages.find({"session_id": session_id}).sort("created_at", 1).limit(limit)
    return [ChatMessageDocument(**doc) async for doc in cursor]


def to_condensed_history(messages: list[ChatMessageDocument]) -> list[dict[str, str]]:
    """Compresses persisted messages into the lightweight role/content pairs
    the agent graph uses for conversational context (token efficiency)."""
    condensed = []
    for msg in messages:
        if msg.role == MessageRole.user:
            condensed.append({"role": "user", "content": msg.content})
        elif msg.type == MessageType.insight:
            condensed.append({"role": "assistant", "content": msg.content})
    return condensed
