# man.dev task runner

# Start everything (API + DB + frontend)
start:
    -lsof -ti :8000 | xargs kill 2>/dev/null
    -lsof -ti :4321 | xargs kill 2>/dev/null
    just dev & just web & wait

# Start API + DB
dev:
    docker compose up -d db
    just migrate
    uv run uvicorn mandev_api.app:create_app --factory --reload --port 8000

# Start frontend dev server
web:
    cd web && npm run dev

# Run all Python tests
test:
    uv run pytest -v

# Run database migrations
migrate:
    cd api && uv run piccolo migrations forwards mandev_api

# Create a new migration
migration name:
    cd api && uv run piccolo migrations new mandev_api --auto --desc "{{name}}"

# Seed database with fake profiles
seed:
    uv run python scripts/seed.py

# Install all dependencies
install:
    uv sync
    cd web && npm install
