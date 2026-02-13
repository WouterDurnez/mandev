"""CLI entry point for man.dev.

Provides commands to initialise developer profiles.
"""

from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console

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
