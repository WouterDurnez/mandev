"""Shared test fixtures for the API test suite."""

import os
import tempfile
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from piccolo.engine.sqlite import SQLiteEngine
from piccolo.table import create_db_tables, drop_db_tables

from mandev_api.tables import User, UserProfile, GitHubStatsCache, ProfileView

ALL_TABLES = [User, UserProfile, GitHubStatsCache, ProfileView]


@pytest.fixture(params=["asyncio"])
def anyio_backend(request: pytest.FixtureRequest) -> str:
    """Override anyio backend to only use asyncio."""
    return request.param


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    """Yield an async HTTP client backed by a temporary SQLite database.

    Overrides the Piccolo engine on each table to use a temp-file SQLite
    database, creates all tables, and tears them down afterward.
    """
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)

    engine = SQLiteEngine(path=db_path)
    original_engines = {}

    for table in ALL_TABLES:
        original_engines[table] = table._meta._db
        table._meta._db = engine

    try:
        await create_db_tables(*ALL_TABLES, if_not_exists=True)

        from mandev_api.app import create_app

        app = create_app()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

        await drop_db_tables(*ALL_TABLES)
    finally:
        for table in ALL_TABLES:
            table._meta._db = original_engines[table]
        os.unlink(db_path)
