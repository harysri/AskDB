from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"


class MessageType(str, Enum):
    text = "text"
    sql = "sql"
    table = "table"
    insight = "insight"
    error = "error"


class ChatMessageDocument(BaseModel):
    """Mongo document shape for the `chat_messages` collection."""

    message_id: str = Field(default_factory=lambda: str(uuid4()))
    session_id: str
    user_id: str
    role: MessageRole
    type: MessageType = MessageType.text
    content: str

    # Optional payloads depending on `type`
    sql: Optional[str] = None
    headers: Optional[list[str]] = None
    rows: Optional[list[list[Any]]] = None
    recommendations: Optional[list[str]] = None

    # Metadata for observability / cost tracking
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    agent: Optional[str] = None  # "main_analyst" | "insight_synthesizer"

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatMessageOut(BaseModel):
    message_id: str
    role: MessageRole
    type: MessageType
    content: str
    sql: Optional[str] = None
    headers: Optional[list[str]] = None
    rows: Optional[list[list[Any]]] = None
    recommendations: Optional[list[str]] = None
    created_at: datetime


class ChatRequest(BaseModel):
    session_id: Optional[str] = Field(
        default=None, description="Existing session ID, or omit to start a new one"
    )
    connection_id: Optional[str] = Field(
        default=None,
        description="Connection to attach to the auto-created session when session_id is omitted",
    )
    message: str = Field(..., min_length=1, max_length=4000)
