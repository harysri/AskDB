"""
execute_safe_sql: the single gateway through which the LangGraph agent is
allowed to touch the customer's database.

Layered safety model:
  1. Static validation: only a single SELECT / WITH (CTE) statement is
     permitted. Any DML/DDL keyword anywhere in the statement is rejected,
     even inside comments or string literals (fail closed).
  2. Statement-count validation: no stacked queries (only one `;`-terminated
     statement, semicolons inside string literals are tolerated by sqlparse).
  3. Automatic LIMIT enforcement so a single query can never return an
     unbounded result set.
  4. Execution against a connection that is already read-only at the
     session and (where supported) transaction level (see sql_connector.py).
  5. Query timeout enforced at the session level.
"""
from __future__ import annotations

import math
import re
import time
from dataclasses import dataclass, field
from datetime import date as date_type
from datetime import datetime as datetime_type
from datetime import time as time_type
from decimal import Decimal
from typing import Any
from uuid import UUID

import sqlparse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database.sql_connector import get_connection
from app.models.schema import ConnectionDocument
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Any statement containing these keywords (as whole words) is rejected outright.
_FORBIDDEN_KEYWORDS = {
    "insert", "update", "delete", "drop", "alter", "truncate", "create",
    "grant", "revoke", "replace", "merge", "call", "exec", "execute",
    "attach", "detach", "vacuum", "reindex", "copy", "into outfile",
    "load_file", "pg_read_file", "pg_write_file", "xp_cmdshell",
}

_ALLOWED_LEADING_KEYWORDS = {"select", "with"}

_KEYWORD_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in _FORBIDDEN_KEYWORDS) + r")\b",
    re.IGNORECASE,
)


@dataclass
class SqlValidationResult:
    is_valid: bool
    reason: str = ""
    normalized_sql: str = ""


@dataclass
class SqlExecutionResult:
    success: bool
    message: str
    headers: list[str] = field(default_factory=list)
    rows: list[list[Any]] = field(default_factory=list)
    row_count: int = 0
    truncated: bool = False
    execution_ms: int = 0
    sql_executed: str = ""


def validate_sql(raw_sql: str) -> SqlValidationResult:
    """Pure static validation — no DB connection required."""
    if not raw_sql or not raw_sql.strip():
        return SqlValidationResult(False, "Empty SQL statement")

    statements = [s for s in sqlparse.parse(raw_sql) if s.token_first(skip_cm=True)]

    if len(statements) == 0:
        return SqlValidationResult(False, "No valid SQL statement found")
    if len(statements) > 1:
        return SqlValidationResult(False, "Only a single SQL statement is permitted per call")

    statement = statements[0]
    normalized = statement.value.strip().rstrip(";").strip()

    first_token = statement.token_first(skip_cm=True)
    first_keyword = (first_token.value or "").lower() if first_token else ""

    if first_keyword not in _ALLOWED_LEADING_KEYWORDS:
        return SqlValidationResult(
            False,
            f"Only SELECT / WITH statements are allowed (found: '{first_keyword or 'unknown'}')",
        )

    forbidden_match = _KEYWORD_PATTERN.search(normalized)
    if forbidden_match:
        return SqlValidationResult(
            False, f"Statement contains a disallowed keyword: '{forbidden_match.group(0)}'"
        )

    # Reject stacked queries hidden via semicolons that sqlparse still bundled together.
    if normalized.count(";") > 0:
        return SqlValidationResult(False, "Stacked / multiple statements are not permitted")

    return SqlValidationResult(True, "OK", normalized_sql=normalized)


def _to_safe_cell(value: Any) -> Any:
    """Coerce DB cell values to BSON/JSON-safe types.

    psycopg2/SQLAlchemy return native Python types (Decimal for NUMERIC,
    datetime, memoryview for bytea, UUID, ...) that neither BSON nor the
    response JSON encoder can serialize. Normalize them here so every row
    survives both the Mongo save and the HTTP response unchanged.
    """
    if value is None:
        return None
    if isinstance(value, Decimal):
        f = float(value)
        return f if math.isfinite(f) else str(value)
    if isinstance(value, (datetime_type, date_type, time_type)):
        return value.isoformat()
    if isinstance(value, (bytes, bytearray, memoryview)):
        return bytes(value).decode("utf-8", errors="replace")
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def _enforce_limit(sql: str, max_rows: int) -> str:
    """Appends a LIMIT clause if the query doesn't already define one."""
    if re.search(r"\blimit\s+\d+\s*$", sql, re.IGNORECASE):
        return sql
    if re.search(r"\blimit\s+\d+\s+offset\s+\d+\s*$", sql, re.IGNORECASE):
        return sql
    return f"{sql}\nLIMIT {max_rows}"


def execute_safe_sql(
    raw_sql: str,
    connection: ConnectionDocument,
    max_rows: int | None = None,
) -> SqlExecutionResult:
    """
    The tool exposed to the LangGraph Main Analyst Agent.
    Validates, bounds, and executes a single read-only SQL statement.
    """
    settings = get_settings()
    max_rows = max_rows or settings.max_rows_returned

    validation = validate_sql(raw_sql)
    if not validation.is_valid:
        logger.warning("Rejected unsafe SQL: %s | reason=%s", raw_sql[:200], validation.reason)
        return SqlExecutionResult(success=False, message=f"Query rejected: {validation.reason}")

    bounded_sql = _enforce_limit(validation.normalized_sql, max_rows)

    start = time.perf_counter()
    try:
        with get_connection(connection) as conn:
            result = conn.execute(text(bounded_sql))
            headers = list(result.keys())
            fetched = result.fetchmany(max_rows + 1)

        truncated = len(fetched) > max_rows
        rows = [[_to_safe_cell(cell) for cell in row] for row in fetched[:max_rows]]
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        return SqlExecutionResult(
            success=True,
            message="Query executed successfully",
            headers=headers,
            rows=rows,
            row_count=len(rows),
            truncated=truncated,
            execution_ms=elapsed_ms,
            sql_executed=bounded_sql,
        )
    except SQLAlchemyError as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        logger.error("SQL execution error after %dms: %s", elapsed_ms, exc)
        return SqlExecutionResult(
            success=False,
            message=f"Database error while executing query: {exc}",
            execution_ms=elapsed_ms,
            sql_executed=bounded_sql,
        )
