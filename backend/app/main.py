from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database.mongodb import close_mongo_connection, connect_to_mongo, mongo_manager
from app.routers import chat, connection, sessions
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    logger.info("AskDB FastAPI core service started")
    yield
    await close_mongo_connection()
    logger.info("AskDB FastAPI core service shut down")


settings = get_settings()

app = FastAPI(
    title="AskDB Core Service",
    description=(
        "Core NL-to-SQL agent engine for AskDB. Not exposed publicly — "
        "all external traffic is routed through the Express.js gateway."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    mongo_ok = mongo_manager.client is not None
    return {
        "status": "ok",
        "service": "askdb-fastapi-core",
        "mongo_connected": mongo_ok,
        "env": settings.app_env,
    }


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "internal_error", "message": "An unexpected error occurred."},
    )


app.include_router(chat.router, prefix="/chat")
app.include_router(connection.router, prefix="/connection")
app.include_router(sessions.router, prefix="/sessions")
