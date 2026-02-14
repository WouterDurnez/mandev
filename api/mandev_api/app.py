"""FastAPI application factory."""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mandev_api.database import engine, Base


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Create database tables on startup."""
    import mandev_api.db_models  # noqa: F401 — ensure models are registered

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


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

    app.include_router(auth_router)
    app.include_router(profile_router)

    return app
