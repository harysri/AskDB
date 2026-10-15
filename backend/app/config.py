from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application configuration, loaded from environment variables / .env.
    Using pydantic-settings gives us validation and type coercion for free.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Server ---
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    # --- Gateway trust boundary ---
    # The Express gateway forwards x-user-id / x-user-email / x-user-role headers.
    # This shared secret (sent as x-gateway-secret) ensures those headers can only
    # be trusted when the request actually came through the gateway.
    trusted_gateway_header_secret: str = ""

    # --- MongoDB Atlas ---
    mongodb_uri: str
    mongodb_db_name: str = "cluster0"

    # --- LLM Providers ---
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.6-27b"

    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # --- Agent behavior ---
    max_agent_iterations: int = 6
    max_rows_returned: int = 200
    sql_query_timeout_seconds: int = 15
    token_budget_per_turn: int = 6000

    # --- Default / fallback DB connection (overridden per-session) ---
    default_db_type: str = "postgresql"
    default_db_host: str = ""
    default_db_port: int = 5432
    default_db_name: str = ""
    default_db_user: str = ""
    default_db_password: str = ""

    # --- Credential encryption ---
    credentials_encryption_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
