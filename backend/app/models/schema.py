from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class DBType(str, Enum):
    postgresql = "postgresql"
    mysql = "mysql"


class ConnectionRequest(BaseModel):
    db_type: DBType
    host: str
    port: int
    database: str
    username: str
    password: str
    save_credentials: bool = False


class ConnectionDocument(BaseModel):
    """Mongo document shape for the `db_connections` collection.
    Password is stored encrypted, never in plaintext.
    """

    connection_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    db_type: DBType
    host: str
    port: int
    database: str
    username: str
    encrypted_password: str
    is_read_only_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_used_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConnectionOut(BaseModel):
    connection_id: str
    db_type: DBType
    host: str
    database: str
    username: str
    is_read_only_verified: bool
    created_at: datetime


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool = True
    is_primary_key: bool = False
    is_foreign_key: bool = False
    references: Optional[str] = None  # "other_table.column"


class TableInfo(BaseModel):
    name: str
    columns: list[ColumnInfo]
    row_count_estimate: Optional[int] = None


class SchemaDocument(BaseModel):
    """Mongo document shape for the `db_schemas` collection.
    Caches introspected schema so we don't re-query information_schema
    on every single chat turn (token + latency efficiency).
    """

    connection_id: str
    database_name: str
    tables: list[TableInfo]
    cached_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_compact_prompt_context(self, max_tables: int = 40) -> str:
        """Serializes schema into a compact, token-efficient string for
        injection into the LLM system prompt."""
        lines: list[str] = []
        for table in self.tables[:max_tables]:
            col_descriptions = ", ".join(
                f"{c.name}:{c.type}{'[PK]' if c.is_primary_key else ''}"
                f"{'[FK->' + c.references + ']' if c.references else ''}"
                for c in table.columns
            )
            lines.append(f"- {table.name}({col_descriptions})")
        return "\n".join(lines)
