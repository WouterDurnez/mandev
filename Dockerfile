FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy workspace
COPY pyproject.toml uv.lock ./
COPY core/ core/
COPY api/ api/

# Install dependencies
RUN uv sync --no-dev --no-install-workspace && \
    uv pip install --no-deps -e core/ -e api/

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "mandev_api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
