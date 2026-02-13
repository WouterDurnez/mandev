"""CLI entry point for man.dev.

Provides commands to initialise, authenticate, and push developer profiles.
"""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import typer
from rich.console import Console

from mandev_core import load_config

from mandev_cli.config import API_BASE_URL, AUTH_FILE

app = typer.Typer(help="man.dev CLI -- your manual, as a developer.")
console = Console()

# ---------------------------------------------------------------------------
# Template for new .mandev.toml files
# ---------------------------------------------------------------------------

_INIT_TEMPLATE = """\
[profile]
name = "{name}"
tagline = "{tagline}"

[theme]
scheme = "dracula"
font = "JetBrains Mono"
mode = "dark"

[layout]
sections = ["bio", "skills", "projects", "experience", "links"]
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _read_token() -> str:
    """Read the stored JWT from the auth file.

    :returns: The access token string.
    :raises typer.Exit: If no auth file is found.
    """
    if not AUTH_FILE.exists():
        console.print("[red]Not logged in. Run `mandev login` first.[/red]")
        raise typer.Exit(code=1)
    data = json.loads(AUTH_FILE.read_text())
    return data["access_token"]


def _auth_header(token: str) -> dict[str, str]:
    """Build an Authorization header from a token.

    :param token: JWT access token.
    :returns: Header dict.
    """
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

@app.command()
def init(
    name: str = typer.Option(..., prompt=True, help="Your display name."),
    tagline: str = typer.Option("", prompt=True, help="A short tagline."),
) -> None:
    """Scaffold a new ``.mandev.toml`` in the current directory."""
    config_path = Path.cwd() / ".mandev.toml"
    if config_path.exists():
        console.print("[red].mandev.toml already exists.[/red]")
        raise typer.Exit(code=1)
    content = _INIT_TEMPLATE.format(name=name, tagline=tagline)
    config_path.write_text(content)
    console.print(f"[green]Created .mandev.toml for {name}[/green]")


@app.command()
def login(
    email: str = typer.Option(..., prompt=True, help="Your email address."),
    password: str = typer.Option(
        ..., prompt=True, hide_input=True, help="Your password."
    ),
) -> None:
    """Authenticate with man.dev and save a JWT locally."""
    response = httpx.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
    )
    if response.status_code != 200:
        console.print("[red]Login failed.[/red]")
        raise typer.Exit(code=1)

    AUTH_FILE.parent.mkdir(parents=True, exist_ok=True)
    AUTH_FILE.write_text(json.dumps(response.json()))
    console.print("[green]Logged in successfully.[/green]")


@app.command()
def whoami() -> None:
    """Show the currently authenticated user."""
    token = _read_token()
    response = httpx.get(
        f"{API_BASE_URL}/api/auth/me",
        headers=_auth_header(token),
    )
    if response.status_code != 200:
        console.print("[red]Failed to fetch user info.[/red]")
        raise typer.Exit(code=1)

    data = response.json()
    console.print(f"Username: {data['username']}")
    console.print(f"Email: {data['email']}")


@app.command()
def push() -> None:
    """Push the local config to man.dev."""
    token = _read_token()
    try:
        config = load_config(Path.cwd())
    except FileNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(code=1)

    response = httpx.put(
        f"{API_BASE_URL}/api/profile",
        json=config.model_dump(),
        headers=_auth_header(token),
    )
    if response.status_code != 200:
        console.print("[red]Push failed.[/red]")
        raise typer.Exit(code=1)

    console.print("[green]Profile pushed successfully.[/green]")
