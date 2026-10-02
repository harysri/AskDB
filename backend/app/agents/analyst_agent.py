"""
Main Analyst Agent — powered by Groq (Qwen 3.6-27B).

Responsibilities:
  - Understand the user's natural-language question in the context of the
    known database schema.
  - Plan and generate a single read-only SQL query.
  - Invoke the execute_safe_sql tool to run it.
  - On failure, revise the query (bounded by max_iterations) using the
    database error message as feedback.
  - Produce a short natural-language narration of what it did.
"""
from __future__ import annotations

import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.agents.state import AgentState
from app.config import get_settings
from app.tools.sql_tool import execute_safe_sql
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are the Main Analyst Agent inside AskDB, a natural-language-to-SQL \
data analyst assistant. You convert business questions into a single, safe, \
read-only SQL query against the connected database, then explain the result.

Rules:
- You may ONLY write SELECT or WITH (CTE) statements. Never write INSERT, \
UPDATE, DELETE, DROP, ALTER, TRUNCATE, or any other mutating statement.
- Always qualify ambiguous column names with their table.
- Prefer explicit column lists over `SELECT *` when the table is wide.
- Add a reasonable LIMIT unless the user clearly wants an aggregate/single value.
- If the schema does not contain the data needed to answer the question, say so \
plainly instead of guessing table/column names.
- Output ONLY the SQL query inside a ```sql code block — no other commentary in \
that response.

Database schema ({dialect}):
{schema_context}
"""

REVISION_PROMPT_TEMPLATE = """Your previous query failed. Fix it and return ONLY a corrected \
SQL query inside a ```sql code block.

Previous SQL:
{previous_sql}

Database error:
{error_message}
"""

_SQL_BLOCK_PATTERN = re.compile(r"```sql\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def _extract_sql(llm_output: str) -> str:
    match = _SQL_BLOCK_PATTERN.search(llm_output)
    if match:
        return match.group(1).strip()
    # Fallback: assume the whole output is SQL if no code fence was used.
    return llm_output.strip().strip("`")


def _build_llm() -> ChatGroq:
    settings = get_settings()
    return ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0.0,
        max_tokens=1024,
    )


def run_main_analyst(state: AgentState) -> AgentState:
    """LangGraph node: generates SQL, executes it, and stores results in state."""
    settings = get_settings()
    llm = _build_llm()

    schema = state["schema"]
    connection = state["connection"]
    dialect = connection.db_type.value
    schema_context = schema.to_compact_prompt_context()

    iterations = state.get("iterations", 0)
    max_iterations = state.get("max_iterations", settings.max_agent_iterations)

    messages = [
        SystemMessage(
            content=SYSTEM_PROMPT_TEMPLATE.format(dialect=dialect, schema_context=schema_context)
        )
    ]

    for turn in state.get("chat_history", [])[-6:]:
        role = turn.get("role")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))

    previous_sql = state.get("generated_sql")
    previous_error = state.get("error")

    if previous_sql and previous_error:
        messages.append(
            HumanMessage(
                content=REVISION_PROMPT_TEMPLATE.format(
                    previous_sql=previous_sql, error_message=previous_error
                )
            )
        )
    else:
        messages.append(HumanMessage(content=state["user_question"]))

    response = llm.invoke(messages)
    sql = _extract_sql(response.content)

    logger.info("Analyst generated SQL (iteration %d): %s", iterations, sql[:300])

    exec_result = execute_safe_sql(sql, connection, max_rows=settings.max_rows_returned)

    new_state: AgentState = {
        **state,
        "iterations": iterations + 1,
        "generated_sql": sql,
        "tokens_used": state.get("tokens_used", 0)
        + (response.response_metadata.get("token_usage", {}).get("total_tokens", 0) or 0),
    }

    if exec_result.success:
        new_state.update(
            {
                "sql_headers": exec_result.headers,
                "sql_rows": exec_result.rows,
                "sql_row_count": exec_result.row_count,
                "sql_truncated": exec_result.truncated,
                "error": None,
                "analyst_narration": (
                    f"Query returned {exec_result.row_count} row(s)"
                    + (" (truncated)" if exec_result.truncated else "")
                    + f" in {exec_result.execution_ms}ms."
                ),
            }
        )
    else:
        new_state["error"] = exec_result.message

    return new_state


def should_retry(state: AgentState) -> str:
    """LangGraph conditional edge: retry on failure until max_iterations, else stop."""
    settings = get_settings()
    max_iterations = state.get("max_iterations", settings.max_agent_iterations)

    if state.get("error") and state.get("iterations", 0) < max_iterations:
        return "retry"
    if state.get("error"):
        return "give_up"
    return "success"
