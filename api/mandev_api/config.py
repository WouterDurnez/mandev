"""API configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings.

    Loaded from environment variables or ``.env`` file.
    """

    database_url: str = "sqlite+aiosqlite:///mandev.db"
    secret_key: str = "changeme-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week
    github_token: str | None = None
    github_oauth_client_id: str | None = None
    github_oauth_client_secret: str | None = None

    model_config = {"env_prefix": "MANDEV_"}


settings = Settings()
