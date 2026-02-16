"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from piccolo.engine import engine_finder


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Start and stop the Piccolo connection pool."""
    engine = engine_finder()
    if hasattr(engine, "start_connection_pool"):
        await engine.start_connection_pool()
    yield
    if hasattr(engine, "close_connection_pool"):
        await engine.close_connection_pool()


def create_app() -> FastAPI:
    """Build and return the FastAPI application.

    :returns: Configured FastAPI instance.
    """
    app = FastAPI(title="man.dev API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:4321", "http://localhost:4322", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        """Return a simple health-check response."""
        return {"status": "ok"}

    # Import and register routers
    from mandev_api.routers.auth import router as auth_router
    from mandev_api.routers.profile import router as profile_router
    from mandev_api.routers.github_oauth import router as github_oauth_router

    app.include_router(auth_router)
    app.include_router(profile_router)
    app.include_router(github_oauth_router)

    return app
