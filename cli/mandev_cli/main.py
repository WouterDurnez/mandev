"""CLI entry point for man.dev.

Provides commands to initialise, authenticate, push, preview, and
validate developer profiles.
"""

from __future__ import annotations

import difflib
import json
import re
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


@app.command("export-json")
def export_json(
    output: Path | None = typer.Option(
        None,
        "--output",
        "-o",
        help="Write JSON to a file path. Prints to stdout when omitted.",
    ),
) -> None:
    """Export the local config as canonical JSON."""
    try:
        config = load_config(Path.cwd())
    except FileNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(code=1)

    payload = json.dumps(config.model_dump(), indent=2)
    if output is None:
        console.print(payload)
        return

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(payload + "\n")
    console.print(f"[green]Exported config JSON to {output}[/green]")




@app.command()
def diff() -> None:
    """Show a unified diff between remote and local profile config."""
    token = _read_token()

    try:
        local_config = load_config(Path.cwd()).model_dump()
    except FileNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(code=1)

    response = httpx.get(
        f"{API_BASE_URL}/api/profile",
        headers=_auth_header(token),
    )
    if response.status_code != 200:
        console.print("[red]Failed to fetch remote profile.[/red]")
        raise typer.Exit(code=1)

    try:
        remote_config = MandevConfig.model_validate(response.json()).model_dump()
    except PydanticValidationError:
        console.print("[red]Remote profile is invalid and cannot be diffed.[/red]")
        raise typer.Exit(code=1)

    remote_lines = json.dumps(remote_config, indent=2, sort_keys=True).splitlines()
    local_lines = json.dumps(local_config, indent=2, sort_keys=True).splitlines()

    unified = list(
        difflib.unified_diff(
            remote_lines,
            local_lines,
            fromfile='remote',
            tofile='local',
            lineterm='',
        )
    )

    if not unified:
        console.print('[green]No differences between local and remote profile.[/green]')
        return

    console.print('[yellow]Differences found:[/yellow]')
    for line in unified:
        if line.startswith('+') and not line.startswith('+++'):
            console.print(f"[green]{line}[/green]")
        elif line.startswith('-') and not line.startswith('---'):
            console.print(f"[red]{line}[/red]")
        else:
            console.print(line)


@app.command()
def doctor() -> None:
    """Run profile quality checks and suggest improvements."""
    try:
        config = load_config(Path.cwd())
    except FileNotFoundError as exc:
        console.print(f"[red]{exc}[/red]")
        raise typer.Exit(code=1)

    findings: list[str] = []
    suggestions: list[str] = []

    if not config.profile.about:
        findings.append("Missing profile.about")
        suggestions.append("Add a concise bio describing your focus and outcomes.")
    elif len(config.profile.about.strip()) < 60:
        findings.append("profile.about is very short")
        suggestions.append("Expand your bio with concrete impact and domain context.")

    if not config.skills:
        findings.append("No skills listed")
        suggestions.append("Add 3-8 skills to improve discoverability.")

    if not config.projects:
        findings.append("No projects listed")
        suggestions.append("Add at least one project with links and outcomes.")
    else:
        missing_descriptions = sum(1 for project in config.projects if not project.description)
        if missing_descriptions:
            findings.append(f"{missing_descriptions} project(s) missing descriptions")
            suggestions.append("Add short, result-focused descriptions for each project.")

    if not config.links:
        findings.append("No links listed")
        suggestions.append("Add at least GitHub and one contact/personal link.")

    date_re = re.compile(r"^\d{4}-\d{2}$")
    invalid_dates = 0
    for exp in config.experience:
        if not date_re.match(exp.start):
            invalid_dates += 1
        if exp.end and exp.end != "present" and not date_re.match(exp.end):
            invalid_dates += 1

    if invalid_dates:
        findings.append(f"{invalid_dates} experience date value(s) are not YYYY-MM")
        suggestions.append("Use YYYY-MM format for experience start/end values.")

    if findings:
        console.print("[yellow]Doctor found profile issues:[/yellow]")
        for finding in findings:
            console.print(f"  - {finding}")
        console.print()
        console.print("[cyan]Suggestions:[/cyan]")
        for suggestion in suggestions:
            console.print(f"  - {suggestion}")
        raise typer.Exit(code=1)

    console.print("[green]Doctor check passed. Profile quality looks good.[/green]")
