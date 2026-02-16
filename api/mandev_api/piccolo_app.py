"""Piccolo app registration for mandev_api."""

from piccolo.conf.apps import AppConfig, table_finder

APP_CONFIG = AppConfig(
    app_name="mandev_api",
    migrations_folder_path="mandev_api/piccolo_migrations",
    table_classes=table_finder(modules=["mandev_api.tables"]),
)
