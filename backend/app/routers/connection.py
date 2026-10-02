from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.models.schema import ConnectionOut, ConnectionRequest
from app.schemas.responses import ConnectionTestResponse
from app.services import connection_service
from app.services.security_service import CurrentUser, get_current_user

router = APIRouter(tags=["connection"])


@router.post("/test", response_model=ConnectionTestResponse)
async def test_database_connection(
    request: ConnectionRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Tests connectivity and verifies read-only enforcement WITHOUT persisting credentials."""
    request.save_credentials = False
    connection, is_read_only, message = await connection_service.create_connection(
        db, user.user_id, request
    )

    return ConnectionTestResponse(
        success=True,
        message=message,
        is_read_only_verified=is_read_only,
    )


@router.get("", response_model=list[ConnectionOut])
async def list_connections(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Lists the user's saved database connections, most recently used first."""
    connections = await connection_service.list_connections(db, user.user_id)
    return [
        ConnectionOut(
            connection_id=c.connection_id,
            db_type=c.db_type,
            host=c.host,
            database=c.database,
            username=c.username,
            is_read_only_verified=c.is_read_only_verified,
            created_at=c.created_at,
        )
        for c in connections
    ]


@router.post("", response_model=ConnectionOut, status_code=status.HTTP_201_CREATED)
async def connect_database(
    request: ConnectionRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Establishes and persists a new database connection."""
    # Connections are always persisted on connect (deduplicated by target);
    # only the /connection/test endpoint exercises test-only (no persist).
    request.save_credentials = True
    connection, is_read_only, message = await connection_service.create_connection(
        db, user.user_id, request
    )

    if not is_read_only:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Connection succeeded but could not be verified as read-only. "
                f"{message} Please provide credentials for a SELECT-only database role."
            ),
        )

    return ConnectionOut(
        connection_id=connection.connection_id,
        db_type=connection.db_type,
        host=connection.host,
        database=connection.database,
        username=connection.username,
        is_read_only_verified=connection.is_read_only_verified,
        created_at=connection.created_at,
    )


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_database(
    connection_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    deleted = await connection_service.delete_connection(db, connection_id, user.user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
