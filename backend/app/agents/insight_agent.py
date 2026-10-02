"""
Insight Synthesizer Agent — powered by Google Gemini Flash 2.5.

Takes the tabular result produced by the Main Analyst Agent and turns it
into a short, plain-language business insight plus concrete
recommendations. Kept as a separate, cheaper/faster model since this step
is pure language synthesis over already-retrieved data (no further DB
access, no tool calls) — an intentional cost/latency optimization.
"""
from __future__ import annotations

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.agents.state import AgentState
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are the Insight Synthesizer Agent inside AskDB. You receive the \
question a business user asked and the tabular result of the SQL query that \
answered it. Produce a short, plain-language business insight (2-4 sentences, \
no jargon) plus 2-4 concrete, actionable recommendations.

Respond ONLY with a JSON object in this exact shape, no other text:
{{"insight": "...", "recommendations": ["...", "..."]}}
"""

USER_PROMPT_TEMPLATE = """Question: {question}

Result columns: {headers}
Result rows (sample, up to 25): {sample_rows}
Total rows returned: {row_count}{truncated_note}
"""

_JSON_PATTERN = re.compile(r"\{.*\}", re.DOTALL)


def _build_llm() -> ChatGoogleGenerativeAI:
    settings = get_settings()
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
        max_output_tokens=512,
    )


def _should_run(state: AgentState) -> bool:
    """Only synthesize insight when we have a non-trivial result to reason about."""
    return bool(state.get("sql_rows")) and state.get("sql_row_count", 0) > 0


def run_insight_synthesizer(state: AgentState) -> AgentState:
    if not _should_run(state):
        return {**state, "should_synthesize_insight": False, "insight_text": None, "recommendations": []}

    llm = _build_llm()

    headers = state.get("sql_headers", [])
    rows = state.get("sql_rows", [])[:25]
    truncated_note = " (result was truncated by row limit)" if state.get("sql_truncated") else ""

    prompt = USER_PROMPT_TEMPLATE.format(
        question=state["user_question"],
        headers=headers,
        sample_rows=rows,
        row_count=state.get("sql_row_count", 0),
        truncated_note=truncated_note,
    )

    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)]
    response = llm.invoke(messages)

    insight_text = None
    recommendations: list[str] = []

    match = _JSON_PATTERN.search(response.content)
    if match:
        try:
            parsed = json.loads(match.group(0))
            insight_text = parsed.get("insight")
            recommendations = parsed.get("recommendations", [])
        except json.JSONDecodeError:
            logger.warning("Insight synthesizer returned non-JSON output: %s", response.content[:200])
            insight_text = response.content.strip()
    else:
        insight_text = response.content.strip()

    return {
        **state,
        "should_synthesize_insight": True,
        "insight_text": insight_text,
        "recommendations": recommendations,
    }
