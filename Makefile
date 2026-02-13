.PHONY: dev api web test install

dev: ## Start API + DB via docker-compose
	docker compose up -d db
	uv run uvicorn mandev_api.app:create_app --factory --reload --port 8000

web: ## Start frontend dev server
	cd web && npm run dev

test: ## Run all Python tests
	uv run pytest -v

install: ## Install all dependencies
	uv sync
	cd web && npm install

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
