from typing import Any, Optional

from pydantic import BaseModel

from app.models.chat import ChatMessageOut


class ChatTurnResponse(BaseModel):
    """Response returned after a full agent turn (analyst + optional insight synthesis)."""

    session_id: str
    messages: list[ChatMessageOut]


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    detected_db_version: Optional[str] = None
    is_read_only_verified: bool = False


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Any] = None
