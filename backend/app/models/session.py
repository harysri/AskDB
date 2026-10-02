from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class SessionDocument(BaseModel):
    """Mongo document shape for the `sessions` collection."""

    session_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    connection_id: Optional[str] = None
    title: str = "New Session"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_archived: bool = False
    message_count: int = 0


class SessionOut(BaseModel):
    session_id: str
    title: str
    connection_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    message_count: int
    is_archived: bool = False


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    is_archived: Optional[bool] = None
    connection_id: Optional[str] = None
