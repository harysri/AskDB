"""
LangGraph multi-agent orchestration for AskDB.

Flow:
    START -> main_analyst -> (retry loop on SQL error, bounded by max_iterations)
          -> insight_synthesizer (only if rows were returned)
          -> END

The graph is compiled once at import time and reused across requests;
per-request data flows entirely through AgentState, so this is safe for
concurrent use under ASGI.
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.agents.analyst_agent import run_main_analyst, should_retry
from app.agents.insight_agent import run_insight_synthesizer
from app.agents.state import AgentState
from app.config import get_settings
from app.models.schema import ConnectionDocument, SchemaDocument
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("main_analyst", run_main_analyst)
    graph.add_node("insight_synthesizer", run_insight_synthesizer)

    graph.set_entry_point("main_analyst")

    graph.add_conditional_edges(
        "main_analyst",
        should_retry,
        {
            "retry": "main_analyst",
            "success": "insight_synthesizer",
            "give_up": END,
        },
    )

    graph.add_edge("insight_synthesizer", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = _build_graph()
        logger.info("Compiled AskDB LangGraph agent pipeline")
    return _compiled_graph


def run_agent_pipeline(
    user_question: str,
    schema: SchemaDocument,
    connection: ConnectionDocument,
    chat_history: list[dict[str, str]] | None = None,
) -> AgentState:
    settings = get_settings()
    graph = get_graph()

    initial_state: AgentState = {
        "user_question": user_question,
        "schema": schema,
        "connection": connection,
        "chat_history": chat_history or [],
        "iterations": 0,
        "max_iterations": settings.max_agent_iterations,
        "generated_sql": None,
        "sql_headers": [],
        "sql_rows": [],
        "sql_row_count": 0,
        "sql_truncated": False,
        "analyst_narration": "",
        "should_synthesize_insight": False,
        "insight_text": None,
        "recommendations": [],
        "error": None,
        "tokens_used": 0,
    }

    final_state = graph.invoke(initial_state)
    return final_state
