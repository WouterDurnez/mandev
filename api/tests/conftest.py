"""Shared test fixtures for the API test suite."""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from mandev_api.database import Base, get_db

# Ensure ORM models are registered on Base.metadata before create_all.
import mandev_api.db_models  # noqa: F401


@pytest.fixture(params=["asyncio"])
def anyio_backend(request: pytest.FixtureRequest) -> str:
    """Override anyio backend to only use asyncio (SQLAlchemy async requires it)."""
    return request.param


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    """Yield an async HTTP client backed by an in-memory SQLite database.

    Creates all tables before the test and tears them down afterward.
    The ``get_db`` dependency is overridden so the app uses the test
    database.
    """
    engine = create_async_engine("sqlite+aiosqlite://", echo=False)
    test_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def _override_get_db() -> AsyncGenerator[AsyncSession]:
        async with test_session() as session:
            yield session

    # Import app factory *after* engine setup to avoid import-time side-effects
    from mandev_api.app import create_app

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
