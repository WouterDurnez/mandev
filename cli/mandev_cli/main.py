"""CLI entry point for man.dev.

Provides commands to initialise, authenticate, push, preview, and
validate developer profiles.
"""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import typer
from pydantic import ValidationError as PydanticValidationError
from rich.console import Console

from mandev_core import MandevConfig, load_config

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


@app.command()
def preview() -> None:
    """Render the local config as a man page in the terminal."""
    try:
        config = load_config(Path.cwd())
    except FileNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(code=1)

    username = config.profile.name.upper().replace(" ", "")
    header = f"{username}(7){'man.dev Manual':^40}{username}(7)"
    console.print(header)
    console.print()

    # NAME
    console.print("NAME")
    tagline_part = f" -- {config.profile.tagline}" if config.profile.tagline else ""
    console.print(f"       {config.profile.name}{tagline_part}")
    console.print()

    # DESCRIPTION
    if config.profile.about:
        console.print("DESCRIPTION")
        console.print(f"       {config.profile.about}")
        console.print()

    # SKILLS
    if config.skills:
        console.print("SKILLS")
        level_bars: dict[str, str] = {
            "beginner": "\u2588" * 5 + "\u2591" * 15,
            "intermediate": "\u2588" * 10 + "\u2591" * 10,
            "advanced": "\u2588" * 15 + "\u2591" * 5,
            "expert": "\u2588" * 20,
        }
        max_name_len = max(len(s.name) for s in config.skills)
        for skill in config.skills:
            bar = level_bars[skill.level]
            padded = skill.name.ljust(max_name_len)
            console.print(f"       {padded} {bar} {skill.level}")
        console.print()

    # PROJECTS
    if config.projects:
        console.print("PROJECTS")
        for proj in config.projects:
            desc = f"  {proj.description}" if proj.description else ""
            console.print(f"       {proj.name}{desc}")
        console.print()

    # EXPERIENCE
    if config.experience:
        console.print("EXPERIENCE")
        for exp in config.experience:
            end = exp.end or "present"
            console.print(f"       {exp.role} at {exp.company} ({exp.start}\u2013{end})")
        console.print()

    # SEE ALSO (links)
    if config.links:
        console.print("SEE ALSO")
        for link in config.links:
            console.print(f"       {link.label}: {link.url}")
        console.print()


@app.command()
def validate() -> None:
    """Validate the local config file against the schema."""
    try:
        load_config(Path.cwd())
    except FileNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(code=1)
    except PydanticValidationError as exc:
        console.print("[red]Validation failed:[/red]")
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error["loc"])
            console.print(f"  {loc}: {error['msg']}")
        raise typer.Exit(code=1)

    console.print("[green]Config is valid.[/green]")
