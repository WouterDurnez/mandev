"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    """Build and return the FastAPI application.

    :returns: Configured FastAPI instance.
    """
    app = FastAPI(title="man.dev API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
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
