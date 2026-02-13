# man.dev task runner

# Start API + DB
dev:
    docker compose up -d db
    uv run uvicorn mandev_api.app:create_app --factory --reload --port 8000

# Start frontend dev server
web:
    cd web && npm run dev

# Run all Python tests
test:
    uv run pytest -v

# Install all dependencies
install:
    uv sync
    cd web && npm install
