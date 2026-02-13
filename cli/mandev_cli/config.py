"""CLI configuration: paths and defaults."""

from pathlib import Path

API_BASE_URL = "https://man.dev"
AUTH_FILE = Path.home() / ".config" / "mandev" / "auth.json"
