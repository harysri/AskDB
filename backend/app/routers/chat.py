from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.agents.graph import run_agent_pipeline
from app.database.mongodb import get_db
from app.models.chat import ChatMessageDocument, ChatMessageOut, ChatRequest, MessageRole, MessageType
from app.schemas.responses import ChatTurnResponse
from app.services import connection_service, schema_service, session_service
from app.services.security_service import CurrentUser, get_current_user
from app.utils.logger import get_logger

router = APIRouter(tags=["chat"])
logger = get_logger(__name__)


@router.post("", response_model=ChatTurnResponse)
async def send_chat_message(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # 1. Resolve or create the session.
    if request.session_id:
        session = await session_service.get_session(db, request.session_id, user.user_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    else:
        session = await session_service.create_session(
            db, user.user_id, connection_id=request.connection_id
        )

    if not session.connection_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session has no connected database. Connect a database before chatting.",
        )

    connection = await connection_service.get_connection(db, session.connection_id, user.user_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The connected database could not be found. Please reconnect.",
        )

    # 2. Persist the user's message immediately.
    user_message = ChatMessageDocument(
        session_id=session.session_id,
        user_id=user.user_id,
        role=MessageRole.user,
        type=MessageType.text,
        content=request.message,
    )
    await session_service.save_message(db, user_message)
    await session_service.auto_title_session_if_needed(
        db, session.session_id, user.user_id, request.message
    )

    # 3. Gather context: schema (cached) + condensed chat history.
    schema = await schema_service.get_or_refresh_schema(db, connection)
    history_docs = await session_service.get_chat_history(db, session.session_id, limit=20)
    condensed_history = session_service.to_condensed_history(history_docs)

    # 4. Run the LangGraph agent pipeline (Main Analyst -> Insight Synthesizer).
    try:
        final_state = run_agent_pipeline(
            user_question=request.message,
            schema=schema,
            connection=connection,
            chat_history=condensed_history,
        )
    except Exception as exc:  # noqa: BLE001 - surface as a chat error message, don't crash the API
        logger.exception("Agent pipeline failed")
        error_message = ChatMessageDocument(
            session_id=session.session_id,
            user_id=user.user_id,
            role=MessageRole.assistant,
            type=MessageType.error,
            content=f"Something went wrong while analyzing your question: {exc}",
        )
        await session_service.save_message(db, error_message)
        await session_service.touch_session(db, session.session_id, increment_messages=2)
        return ChatTurnResponse(
            session_id=session.session_id,
            messages=[_to_out(error_message)],
        )

    await connection_service.touch_connection(db, connection.connection_id)

    response_messages: list[ChatMessageDocument] = []

    if final_state.get("error"):
        response_messages.append(
            ChatMessageDocument(
                session_id=session.session_id,
                user_id=user.user_id,
                role=MessageRole.assistant,
                type=MessageType.error,
                content=(
                    "I wasn't able to produce a safe, working query for that question after "
                    f"{final_state.get('iterations', 0)} attempt(s). Last error: {final_state['error']}"
                ),
                agent="main_analyst",
            )
        )
    else:
        # SQL message
        response_messages.append(
            ChatMessageDocument(
                session_id=session.session_id,
                user_id=user.user_id,
                role=MessageRole.assistant,
                type=MessageType.sql,
                content=final_state.get("analyst_narration", "Here's the query I ran:"),
                sql=final_state.get("generated_sql"),
                agent="main_analyst",
            )
        )

        # Table message
        response_messages.append(
            ChatMessageDocument(
                session_id=session.session_id,
                user_id=user.user_id,
                role=MessageRole.assistant,
                type=MessageType.table,
                content="Here are the results from your database query:",
                headers=final_state.get("sql_headers", []),
                rows=final_state.get("sql_rows", []),
                agent="main_analyst",
            )
        )

        # Insight message (only if synthesized)
        if final_state.get("should_synthesize_insight") and final_state.get("insight_text"):
            response_messages.append(
                ChatMessageDocument(
                    session_id=session.session_id,
                    user_id=user.user_id,
                    role=MessageRole.assistant,
                    type=MessageType.insight,
                    content=final_state["insight_text"],
                    recommendations=final_state.get("recommendations", []),
                    agent="insight_synthesizer",
                )
            )

    for msg in response_messages:
        try:
            await session_service.save_message(db, msg)
        except Exception as exc:  # noqa: BLE001 - one bad message must not kill the whole turn
            logger.warning("Failed to persist %s message %s: %s", msg.type.value, msg.message_id, exc)

    await session_service.touch_session(
        db, session.session_id, increment_messages=1 + len(response_messages)
    )

    return ChatTurnResponse(
        session_id=session.session_id,
        messages=[_to_out(m) for m in response_messages],
    )


def _to_out(doc: ChatMessageDocument) -> ChatMessageOut:
    return ChatMessageOut(
        message_id=doc.message_id,
        role=doc.role,
        type=doc.type,
        content=doc.content,
        sql=doc.sql,
        headers=doc.headers,
        rows=doc.rows,
        recommendations=doc.recommendations,
        created_at=doc.created_at,
    )
