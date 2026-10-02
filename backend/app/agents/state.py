"""
Shared state passed between nodes in the LangGraph agent graph.
"""
from __future__ import annotations

from typing import Any, Optional, TypedDict

from app.models.schema import ConnectionDocument, SchemaDocument


class AgentState(TypedDict, total=False):
    # Inputs
    user_question: str
    schema: SchemaDocument
    connection: ConnectionDocument
    chat_history: list[dict[str, str]]  # condensed prior turns for context

    # Main Analyst Agent working memory
    iterations: int
    max_iterations: int
    generated_sql: Optional[str]
    sql_headers: list[str]
    sql_rows: list[list[Any]]
    sql_row_count: int
    sql_truncated: bool
    analyst_narration: str

    # Insight Synthesizer Agent output
    should_synthesize_insight: bool
    insight_text: Optional[str]
    recommendations: list[str]

    # Control / error flow
    error: Optional[str]
    tokens_used: int
