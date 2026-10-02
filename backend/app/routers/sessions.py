from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.models.session import SessionOut, SessionUpdate
from app.services import connection_service, session_service
from app.services.security_service import CurrentUser, get_current_user

router = APIRouter(tags=["sessions"])


@router.get("", response_model=list[SessionOut])
async def list_sessions(
    include_archived: bool = Query(default=False),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    sessions = await session_service.list_sessions(db, user.user_id, include_archived)
    return [
        SessionOut(
            session_id=s.session_id,
            title=s.title,
            connection_id=s.connection_id,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=s.message_count,
            is_archived=s.is_archived,
        )
        for s in sessions
    ]


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    connection_id: str | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    session = await session_service.create_session(db, user.user_id, connection_id)
    return SessionOut(
        session_id=session.session_id,
        title=session.title,
        connection_id=session.connection_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=session.message_count,
        is_archived=session.is_archived,
    )


@router.get("/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    session = await session_service.get_session(db, session_id, user.user_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = await session_service.get_chat_history(db, session_id, limit=200)
    return messages


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    deleted = await session_service.delete_session(db, session_id, user.user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: str,
    update: SessionUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    session = await session_service.get_session(db, session_id, user.user_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if update.connection_id is not None:
        connection = await connection_service.get_connection(
            db, update.connection_id, user.user_id
        )
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found"
            )

    await session_service.update_session(
        db,
        session_id,
        user.user_id,
        title=update.title,
        is_archived=update.is_archived,
        connection_id=update.connection_id,
    )
    updated = await session_service.get_session(db, session_id, user.user_id)
    return SessionOut(
        session_id=updated.session_id,
        title=updated.title,
        connection_id=updated.connection_id,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        message_count=updated.message_count,
        is_archived=updated.is_archived,
    )
