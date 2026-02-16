"""Piccolo ORM configuration.

Reads database connection settings from environment variables
with defaults matching ``docker-compose.yml``.
"""

import os

from piccolo.conf.apps import AppRegistry
from piccolo.engine.postgres import PostgresEngine

DB = PostgresEngine(
    config={
        "database": os.environ.get("MANDEV_DB_NAME", "mandev"),
        "user": os.environ.get("MANDEV_DB_USER", "mandev"),
        "password": os.environ.get("MANDEV_DB_PASSWORD", "mandev"),
        "host": os.environ.get("MANDEV_DB_HOST", "localhost"),
        "port": int(os.environ.get("MANDEV_DB_PORT", "5432")),
    }
)

APP_REGISTRY = AppRegistry(apps=["mandev_api.piccolo_app"])
