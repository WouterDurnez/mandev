# man.dev MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the man.dev MVP — a developer identity platform with a Python CLI, FastAPI backend, and Astro+React frontend, all sharing a TOML config spec.

**Architecture:** Monorepo with three Python packages (`core`, `api`, `cli`) and one JS frontend (`web`). `core` holds shared Pydantic models and config parsing. `api` is a FastAPI server with Postgres. `cli` is a Typer app. `web` is Astro SSR for public profiles + React SPA for the dashboard. All styled as a terminal emulator.

**Tech Stack:** Python 3.12+, uv, Pydantic, FastAPI, SQLAlchemy, Typer, Rich, httpx, Astro, React, TailwindCSS

---

## Task 1: Project Scaffolding

**Files:**
- Create: `pyproject.toml`
- Create: `core/pyproject.toml`
- Create: `core/mandev_core/__init__.py`
- Create: `api/pyproject.toml`
- Create: `api/mandev_api/__init__.py`
- Create: `cli/pyproject.toml`
- Create: `cli/mandev_cli/__init__.py`
- Create: `.gitignore`
- Create: `.python-version`

**Step 1: Create root pyproject.toml with uv workspaces**

```toml
[project]
name = "mandev"
version = "0.1.0"
description = "man.dev — your manual, as a developer"
requires-python = ">=3.12"

[tool.uv.workspace]
members = ["core", "api", "cli"]

[tool.pytest.ini_options]
testpaths = ["core/tests", "api/tests", "cli/tests"]
```

**Step 2: Create core package**

`core/pyproject.toml`:
```toml
[project]
name = "mandev-core"
version = "0.1.0"
description = "Shared models and config parser for man.dev"
requires-python = ">=3.12"
dependencies = [
    "pydantic>=2.0",
    "tomli>=2.0;python_version<'3.11'",
    "pyyaml>=6.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["mandev_core"]
```

`core/mandev_core/__init__.py`: empty file.

**Step 3: Create api package**

`api/pyproject.toml`:
```toml
[project]
name = "mandev-api"
version = "0.1.0"
description = "FastAPI backend for man.dev"
requires-python = ">=3.12"
dependencies = [
    "mandev-core",
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "aiosqlite>=0.20",
    "passlib[bcrypt]>=1.7",
    "python-jose[cryptography]>=3.3",
    "pydantic-settings>=2.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["mandev_api"]
```

`api/mandev_api/__init__.py`: empty file.

**Step 4: Create cli package**

`cli/pyproject.toml`:
```toml
[project]
name = "mandev-cli"
version = "0.1.0"
description = "CLI for man.dev"
requires-python = ">=3.12"
dependencies = [
    "mandev-core",
    "typer>=0.15",
    "rich>=13.0",
    "httpx>=0.28",
]

[project.scripts]
mandev = "mandev_cli.main:app"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["mandev_cli"]
```

`cli/mandev_cli/__init__.py`: empty file.

**Step 5: Create .gitignore and .python-version**

`.python-version`:
```
3.12
```

`.gitignore`:
```gitignore
__pycache__/
*.py[cod]
*.egg-info/
dist/
.venv/
.env
*.db
*.sqlite3
node_modules/
.astro/
.DS_Store
```

**Step 6: Install dependencies and verify**

Run: `cd /Users/wouter/Repositories/private/mandev && uv sync`
Expected: All packages install successfully.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with core, api, cli packages"
```

---

## Task 2: Core — Config Models

**Files:**
- Create: `core/mandev_core/models.py`
- Create: `core/tests/__init__.py`
- Create: `core/tests/test_models.py`

**Step 1: Write the failing tests**

`core/tests/test_models.py`:
```python
"""Tests for mandev_core config models."""

import pytest
from pydantic import ValidationError

from mandev_core.models import (
    Experience,
    Layout,
    Link,
    MandevConfig,
    Profile,
    Project,
    Skill,
    Theme,
)


class TestProfile:
    """Tests for the Profile model."""

    def test_minimal_profile(self):
        p = Profile(name="Ada Lovelace")
        assert p.name == "Ada Lovelace"
        assert p.tagline is None
        assert p.about is None
        assert p.avatar_url is None

    def test_full_profile(self):
        p = Profile(
            name="Ada Lovelace",
            tagline="Analytical engine whisperer",
            about="Pioneering algorithms since 1843.",
            avatar_url="https://example.com/avatar.png",
        )
        assert p.tagline == "Analytical engine whisperer"

    def test_name_required(self):
        with pytest.raises(ValidationError):
            Profile()


class TestSkill:
    """Tests for the Skill model."""

    def test_valid_levels(self):
        for level in ("beginner", "intermediate", "advanced", "expert"):
            s = Skill(name="Python", level=level)
            assert s.level == level

    def test_invalid_level(self):
        with pytest.raises(ValidationError):
            Skill(name="Python", level="wizard")


class TestProject:
    """Tests for the Project model."""

    def test_minimal_project(self):
        p = Project(name="man.dev")
        assert p.repo is None
        assert p.url is None
        assert p.description is None


class TestExperience:
    """Tests for the Experience model."""

    def test_current_job(self):
        e = Experience(role="Engineer", company="Acme", start="2024-01")
        assert e.end is None

    def test_past_job(self):
        e = Experience(
            role="Engineer", company="Acme", start="2022-01", end="2024-01"
        )
        assert e.end == "2024-01"


class TestLink:
    """Tests for the Link model."""

    def test_link_with_icon(self):
        link = Link(label="GitHub", url="https://github.com/ada", icon="github")
        assert link.icon == "github"

    def test_link_without_icon(self):
        link = Link(label="Website", url="https://example.com")
        assert link.icon is None


class TestTheme:
    """Tests for the Theme model."""

    def test_defaults(self):
        t = Theme()
        assert t.scheme == "dracula"
        assert t.font == "JetBrains Mono"
        assert t.mode == "dark"
        assert t.accent is None

    def test_invalid_mode(self):
        with pytest.raises(ValidationError):
            Theme(mode="sepia")


class TestLayout:
    """Tests for the Layout model."""

    def test_defaults(self):
        layout = Layout()
        assert layout.sections == [
            "bio",
            "skills",
            "projects",
            "experience",
            "links",
        ]

    def test_custom_sections(self):
        layout = Layout(sections=["bio", "projects"])
        assert layout.sections == ["bio", "projects"]


class TestMandevConfig:
    """Tests for the full MandevConfig model."""

    def test_minimal_config(self):
        config = MandevConfig(profile=Profile(name="Ada Lovelace"))
        assert config.profile.name == "Ada Lovelace"
        assert config.theme.scheme == "dracula"
        assert config.skills == []

    def test_full_config(self):
        config = MandevConfig(
            profile=Profile(
                name="Ada Lovelace",
                tagline="Analytical engine whisperer",
                about="Pioneering algorithms since 1843.",
            ),
            theme=Theme(scheme="monokai", font="Fira Code"),
            layout=Layout(sections=["bio", "skills"]),
            skills=[Skill(name="Python", level="expert")],
            projects=[
                Project(name="man.dev", description="Your manual, as a developer.")
            ],
            experience=[
                Experience(role="Engineer", company="Acme", start="2024-01")
            ],
            links=[
                Link(
                    label="GitHub", url="https://github.com/ada", icon="github"
                )
            ],
        )
        assert len(config.skills) == 1
        assert config.skills[0].level == "expert"
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/wouter/Repositories/private/mandev && uv run pytest core/tests/test_models.py -v`
Expected: FAIL — cannot import `mandev_core.models`

**Step 3: Write the implementation**

`core/mandev_core/models.py`:
```python
"""Pydantic models for the mandev config spec.

These models define the schema for ``.mandev.toml`` / ``.mandev.yaml``
config files. They are shared by the CLI, API, and web frontend.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Profile(BaseModel):
    """Developer identity: name, tagline, bio, avatar."""

    name: str
    tagline: str | None = None
    about: str | None = None
    avatar_url: str | None = None


class Skill(BaseModel):
    """A skill with a proficiency level."""

    name: str
    level: Literal["beginner", "intermediate", "advanced", "expert"]


class Project(BaseModel):
    """A project to showcase."""

    name: str
    repo: str | None = None
    url: str | None = None
    description: str | None = None


class Experience(BaseModel):
    """A work experience entry."""

    role: str
    company: str
    start: str
    end: str | None = None
    description: str | None = None


class Link(BaseModel):
    """An external link (GitHub, Twitter, website, etc.)."""

    label: str
    url: str
    icon: str | None = None


class Theme(BaseModel):
    """Visual theme configuration for the web profile."""

    scheme: str = "dracula"
    font: str = "JetBrains Mono"
    mode: Literal["dark", "light"] = "dark"
    accent: str | None = None


class Layout(BaseModel):
    """Controls which sections appear and in what order."""

    sections: list[str] = [
        "bio",
        "skills",
        "projects",
        "experience",
        "links",
    ]


class MandevConfig(BaseModel):
    """Root config model — the single source of truth.

    Represents the full contents of a ``.mandev.toml`` or
    ``.mandev.yaml`` file.
    """

    profile: Profile
    theme: Theme = Theme()
    layout: Layout = Layout()
    skills: list[Skill] = []
    projects: list[Project] = []
    experience: list[Experience] = []
    links: list[Link] = []
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest core/tests/test_models.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add core/mandev_core/models.py core/tests/
git commit -m "feat(core): add Pydantic config models with tests"
```

---

## Task 3: Core — Config Parser

**Files:**
- Create: `core/mandev_core/parser.py`
- Create: `core/tests/test_parser.py`
- Create: `core/tests/fixtures/valid.toml`
- Create: `core/tests/fixtures/valid.yaml`
- Create: `core/tests/fixtures/invalid.toml`

**Step 1: Create test fixtures**

`core/tests/fixtures/valid.toml`:
```toml
[profile]
name = "Ada Lovelace"
tagline = "Analytical engine whisperer"
about = "Pioneering algorithms since 1843."

[theme]
scheme = "dracula"
font = "JetBrains Mono"
mode = "dark"

[layout]
sections = ["bio", "skills", "projects"]

[[skills]]
name = "Python"
level = "expert"

[[projects]]
name = "man.dev"
description = "Your manual, as a developer."

[[experience]]
role = "Engineer"
company = "Acme"
start = "2024-01"

[[links]]
label = "GitHub"
url = "https://github.com/ada"
icon = "github"
```

`core/tests/fixtures/valid.yaml`:
```yaml
profile:
  name: Ada Lovelace
  tagline: Analytical engine whisperer
  about: Pioneering algorithms since 1843.

theme:
  scheme: dracula
  font: JetBrains Mono
  mode: dark

layout:
  sections:
    - bio
    - skills
    - projects

skills:
  - name: Python
    level: expert

projects:
  - name: man.dev
    description: Your manual, as a developer.

experience:
  - role: Engineer
    company: Acme
    start: "2024-01"

links:
  - label: GitHub
    url: https://github.com/ada
    icon: github
```

`core/tests/fixtures/invalid.toml`:
```toml
[profile]
tagline = "Missing name field"
```

**Step 2: Write the failing tests**

`core/tests/test_parser.py`:
```python
"""Tests for config file parsing."""

from pathlib import Path

import pytest
from pydantic import ValidationError

from mandev_core.parser import load_config, parse_toml, parse_yaml

FIXTURES = Path(__file__).parent / "fixtures"


class TestParseToml:
    """Tests for TOML parsing."""

    def test_valid_toml(self):
        config = parse_toml(FIXTURES / "valid.toml")
        assert config.profile.name == "Ada Lovelace"
        assert config.theme.scheme == "dracula"
        assert len(config.skills) == 1
        assert config.skills[0].level == "expert"

    def test_invalid_toml(self):
        with pytest.raises(ValidationError):
            parse_toml(FIXTURES / "invalid.toml")

    def test_missing_file(self):
        with pytest.raises(FileNotFoundError):
            parse_toml(FIXTURES / "nonexistent.toml")


class TestParseYaml:
    """Tests for YAML parsing."""

    def test_valid_yaml(self):
        config = parse_yaml(FIXTURES / "valid.yaml")
        assert config.profile.name == "Ada Lovelace"
        assert config.theme.scheme == "dracula"
        assert len(config.skills) == 1


class TestLoadConfig:
    """Tests for auto-detecting config format."""

    def test_load_toml(self, tmp_path):
        src = FIXTURES / "valid.toml"
        dst = tmp_path / ".mandev.toml"
        dst.write_text(src.read_text())
        config = load_config(tmp_path)
        assert config.profile.name == "Ada Lovelace"

    def test_load_yaml(self, tmp_path):
        src = FIXTURES / "valid.yaml"
        dst = tmp_path / ".mandev.yaml"
        dst.write_text(src.read_text())
        config = load_config(tmp_path)
        assert config.profile.name == "Ada Lovelace"

    def test_toml_preferred_over_yaml(self, tmp_path):
        """When both exist, TOML wins."""
        (tmp_path / ".mandev.toml").write_text(
            (FIXTURES / "valid.toml").read_text()
        )
        (tmp_path / ".mandev.yaml").write_text(
            (FIXTURES / "valid.yaml").read_text()
        )
        config = load_config(tmp_path)
        assert config is not None

    def test_no_config_found(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            load_config(tmp_path)
```

**Step 3: Run tests to verify they fail**

Run: `uv run pytest core/tests/test_parser.py -v`
Expected: FAIL — cannot import `mandev_core.parser`

**Step 4: Write the implementation**

`core/mandev_core/parser.py`:
```python
"""Config file parser for mandev.

Supports auto-detection of ``.mandev.toml`` and ``.mandev.yaml`` files.
"""

from __future__ import annotations

import tomllib
from pathlib import Path

import yaml

from mandev_core.models import MandevConfig

CONFIG_FILENAMES = [".mandev.toml", ".mandev.yaml", ".mandev.yml"]


def parse_toml(path: Path) -> MandevConfig:
    """Parse a TOML config file into a :class:`MandevConfig`.

    :param path: Path to the TOML file.
    :returns: Parsed config.
    :raises FileNotFoundError: If the file does not exist.
    :raises pydantic.ValidationError: If the config is invalid.
    """
    with open(path, "rb") as f:
        data = tomllib.load(f)
    return MandevConfig.model_validate(data)


def parse_yaml(path: Path) -> MandevConfig:
    """Parse a YAML config file into a :class:`MandevConfig`.

    :param path: Path to the YAML file.
    :returns: Parsed config.
    :raises FileNotFoundError: If the file does not exist.
    :raises pydantic.ValidationError: If the config is invalid.
    """
    with open(path) as f:
        data = yaml.safe_load(f)
    return MandevConfig.model_validate(data)


def load_config(directory: Path) -> MandevConfig:
    """Auto-detect and load a config file from *directory*.

    Looks for ``.mandev.toml``, ``.mandev.yaml``, or ``.mandev.yml``
    (in that order). Returns the first match.

    :param directory: Directory to search in.
    :returns: Parsed config.
    :raises FileNotFoundError: If no config file is found.
    """
    for filename in CONFIG_FILENAMES:
        path = directory / filename
        if path.exists():
            if path.suffix == ".toml":
                return parse_toml(path)
            return parse_yaml(path)
    raise FileNotFoundError(
        f"No config file found in {directory}. "
        f"Expected one of: {', '.join(CONFIG_FILENAMES)}"
    )
```

**Step 5: Run tests to verify they pass**

Run: `uv run pytest core/tests/test_parser.py -v`
Expected: All PASS

**Step 6: Export public API from core**

Update `core/mandev_core/__init__.py`:
```python
"""mandev-core: shared models and config parser for man.dev."""

from mandev_core.models import MandevConfig
from mandev_core.parser import load_config, parse_toml, parse_yaml

__all__ = ["MandevConfig", "load_config", "parse_toml", "parse_yaml"]
```

**Step 7: Run full core test suite**

Run: `uv run pytest core/tests/ -v`
Expected: All PASS

**Step 8: Commit**

```bash
git add core/
git commit -m "feat(core): add TOML/YAML config parser with tests"
```

---

## Task 4: API — Project Setup & Database

**Files:**
- Create: `api/mandev_api/config.py`
- Create: `api/mandev_api/database.py`
- Create: `api/mandev_api/db_models.py`
- Create: `api/mandev_api/app.py`
- Create: `api/tests/__init__.py`
- Create: `api/tests/conftest.py`
- Create: `api/tests/test_health.py`

**Step 1: Write the failing test**

`api/tests/conftest.py`:
```python
"""Shared test fixtures for the API."""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from mandev_api.app import create_app
from mandev_api.database import Base, get_db

TEST_DB_URL = "sqlite+aiosqlite:///test.db"


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession]:
    """Create a fresh test database for each test."""
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """HTTP test client with database override."""
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
```

`api/tests/test_health.py`:
```python
"""Tests for API health check."""

import pytest


@pytest.mark.anyio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

**Step 2: Run test to verify it fails**

Run: `uv run pytest api/tests/test_health.py -v`
Expected: FAIL — cannot import `mandev_api.app`

**Step 3: Write the implementation**

`api/mandev_api/config.py`:
```python
"""API configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings.

    Loaded from environment variables or ``.env`` file.
    """

    database_url: str = "sqlite+aiosqlite:///mandev.db"
    secret_key: str = "changeme-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week

    model_config = {"env_prefix": "MANDEV_"}


settings = Settings()
```

`api/mandev_api/database.py`:
```python
"""Database engine, session, and base model."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from mandev_api.config import settings

engine = create_async_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Yield a database session, closing it when done."""
    async with SessionLocal() as session:
        yield session
```

`api/mandev_api/db_models.py`:
```python
"""SQLAlchemy database models."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mandev_api.database import Base


class User(Base):
    """A registered user."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(63), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    profile: Mapped["UserProfile"] = relationship(back_populates="user")


class UserProfile(Base):
    """A user's mandev config, stored as JSON."""

    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    config_json: Mapped[str] = mapped_column(Text, default="{}")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="profile")
```

`api/mandev_api/app.py`:
```python
"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(title="man.dev API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tighten in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    return app
```

Add `anyio` and `pytest-anyio` to api dev deps. Update `api/pyproject.toml` to add:
```toml
[dependency-groups]
dev = ["pytest>=8.0", "pytest-anyio>=0.0.1", "httpx>=0.28", "aiosqlite>=0.20"]
```

**Step 4: Run test to verify it passes**

Run: `uv run pytest api/tests/test_health.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add api/
git commit -m "feat(api): add FastAPI app with database models and health check"
```

---

## Task 5: API — Auth Endpoints

**Files:**
- Create: `api/mandev_api/auth.py`
- Create: `api/mandev_api/routers/__init__.py`
- Create: `api/mandev_api/routers/auth.py`
- Create: `api/tests/test_auth.py`
- Modify: `api/mandev_api/app.py`

**Step 1: Write the failing tests**

`api/tests/test_auth.py`:
```python
"""Tests for auth endpoints."""

import pytest


@pytest.mark.anyio
async def test_signup(client):
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "ada@example.com", "username": "ada", "password": "secret123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "ada"
    assert data["email"] == "ada@example.com"
    assert "password" not in data


@pytest.mark.anyio
async def test_signup_duplicate_email(client):
    payload = {"email": "ada@example.com", "username": "ada", "password": "secret123"}
    await client.post("/api/auth/signup", json=payload)
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "ada@example.com", "username": "ada2", "password": "secret123"},
    )
    assert resp.status_code == 409


@pytest.mark.anyio
async def test_signup_duplicate_username(client):
    payload = {"email": "ada@example.com", "username": "ada", "password": "secret123"}
    await client.post("/api/auth/signup", json=payload)
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "ada2@example.com", "username": "ada", "password": "secret123"},
    )
    assert resp.status_code == 409


@pytest.mark.anyio
async def test_login(client):
    await client.post(
        "/api/auth/signup",
        json={"email": "ada@example.com", "username": "ada", "password": "secret123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.anyio
async def test_login_wrong_password(client):
    await client.post(
        "/api/auth/signup",
        json={"email": "ada@example.com", "username": "ada", "password": "secret123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_me(client):
    await client.post(
        "/api/auth/signup",
        json={"email": "ada@example.com", "username": "ada", "password": "secret123"},
    )
    login = await client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "secret123"},
    )
    token = login.json()["access_token"]
    resp = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "ada"


@pytest.mark.anyio
async def test_me_unauthenticated(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest api/tests/test_auth.py -v`
Expected: FAIL — 404s, missing routes

**Step 3: Write the auth utilities**

`api/mandev_api/auth.py`:
```python
"""Authentication utilities: password hashing and JWT."""

from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from mandev_api.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password.

    :param password: Plaintext password.
    :returns: Bcrypt hash.
    """
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash.

    :param plain: Plaintext password.
    :param hashed: Bcrypt hash.
    :returns: ``True`` if the password matches.
    """
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    """Create a JWT access token for *user_id*.

    :param user_id: The user's database ID.
    :returns: Encoded JWT string.
    """
    expires = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": expires},
        settings.secret_key,
        algorithm="HS256",
    )


def decode_access_token(token: str) -> int | None:
    """Decode a JWT and return the user ID, or ``None`` on failure.

    :param token: Encoded JWT string.
    :returns: User ID or ``None``.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None
```

**Step 4: Write the auth router**

`api/mandev_api/routers/__init__.py`: empty file.

`api/mandev_api/routers/auth.py`:
```python
"""Auth endpoints: signup, login, me."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mandev_api.auth import create_access_token, decode_access_token, hash_password, verify_password
from mandev_api.database import get_db
from mandev_api.db_models import User, UserProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])


# --- Schemas ---

class SignupRequest(BaseModel):
    """Request body for signup."""

    email: EmailStr
    username: str
    password: str


class SignupResponse(BaseModel):
    """Response body for signup."""

    id: int
    email: str
    username: str


class LoginRequest(BaseModel):
    """Request body for login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response body containing an access token."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Response body for the current user."""

    id: int
    email: str
    username: str


# --- Dependencies ---

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: str | None = None,
) -> User:
    """Extract and validate the current user from the Authorization header.

    :param db: Database session.
    :param authorization: Raw Authorization header value.
    :returns: The authenticated user.
    :raises HTTPException: If the token is missing or invalid.
    """
    # FastAPI doesn't auto-inject raw headers this way;
    # we'll use a proper Header dependency in the router.
    raise HTTPException(status_code=401, detail="Not authenticated")


# --- Routes ---

@router.post("/signup", status_code=201, response_model=SignupResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.username == body.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email or username already taken")

    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    profile = UserProfile(user_id=user.id, config_json="{}")
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    return SignupResponse(id=user.id, email=user.email, username=user.username)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(
    db: AsyncSession = Depends(get_db),
    authorization: str = "",
):
    """Return the currently authenticated user."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ")
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return UserResponse(id=user.id, email=user.email, username=user.username)
```

Note: The `me` endpoint reads `authorization` as a query-style param. We need to use FastAPI's `Header` dependency instead. Update the `me` function signature:

```python
from fastapi import Header

@router.get("/me", response_model=UserResponse)
async def me(
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
```

**Step 5: Register the router in the app**

Update `api/mandev_api/app.py` to import and include the auth router:

```python
from mandev_api.routers.auth import router as auth_router

def create_app() -> FastAPI:
    app = FastAPI(title="man.dev API", version="0.1.0")
    # ... middleware ...
    app.include_router(auth_router)

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    return app
```

Add `pydantic[email]` to api dependencies (for `EmailStr`).

**Step 6: Run tests to verify they pass**

Run: `uv run pytest api/tests/test_auth.py -v`
Expected: All PASS

**Step 7: Commit**

```bash
git add api/
git commit -m "feat(api): add auth endpoints (signup, login, me) with JWT"
```

---

## Task 6: API — Profile Endpoints

**Files:**
- Create: `api/mandev_api/routers/profile.py`
- Create: `api/tests/test_profile.py`
- Modify: `api/mandev_api/app.py`

**Step 1: Write the failing tests**

`api/tests/test_profile.py`:
```python
"""Tests for profile endpoints."""

import json

import pytest

SAMPLE_CONFIG = {
    "profile": {"name": "Ada Lovelace", "tagline": "Analytical engine whisperer"},
    "theme": {"scheme": "dracula"},
    "skills": [{"name": "Python", "level": "expert"}],
}


async def create_and_login(client, email="ada@example.com", username="ada"):
    """Helper: create user and return auth headers."""
    await client.post(
        "/api/auth/signup",
        json={"email": email, "username": username, "password": "secret123"},
    )
    login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "secret123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_get_own_profile_empty(client):
    headers = await create_and_login(client)
    resp = await client.get("/api/profile", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data == {}


@pytest.mark.anyio
async def test_put_and_get_profile(client):
    headers = await create_and_login(client)
    resp = await client.put("/api/profile", json=SAMPLE_CONFIG, headers=headers)
    assert resp.status_code == 200

    resp = await client.get("/api/profile", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["name"] == "Ada Lovelace"


@pytest.mark.anyio
async def test_put_invalid_config(client):
    headers = await create_and_login(client)
    resp = await client.put(
        "/api/profile", json={"profile": {"tagline": "no name"}}, headers=headers
    )
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_get_public_profile(client):
    headers = await create_and_login(client)
    await client.put("/api/profile", json=SAMPLE_CONFIG, headers=headers)

    resp = await client.get("/api/profile/ada")
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["name"] == "Ada Lovelace"
    assert data["username"] == "ada"


@pytest.mark.anyio
async def test_get_public_profile_not_found(client):
    resp = await client.get("/api/profile/nobody")
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_validate_config(client):
    resp = await client.post("/api/config/validate", json=SAMPLE_CONFIG)
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


@pytest.mark.anyio
async def test_validate_invalid_config(client):
    resp = await client.post(
        "/api/config/validate", json={"profile": {"tagline": "no name"}}
    )
    assert resp.status_code == 200
    assert resp.json()["valid"] is False
    assert len(resp.json()["errors"]) > 0
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest api/tests/test_profile.py -v`
Expected: FAIL — 404s

**Step 3: Write the profile router**

`api/mandev_api/routers/profile.py`:
```python
"""Profile endpoints: get, update, public view, validate."""

import json

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from mandev_core.models import MandevConfig
from mandev_api.auth import decode_access_token
from mandev_api.database import get_db
from mandev_api.db_models import User, UserProfile

router = APIRouter(tags=["profile"])


async def _get_authed_user(
    db: AsyncSession, authorization: str
) -> User:
    """Extract authenticated user from Authorization header.

    :param db: Database session.
    :param authorization: Raw header value.
    :returns: The user.
    :raises HTTPException: On auth failure.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_access_token(authorization.removeprefix("Bearer "))
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/api/profile")
async def get_own_profile(
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    """Get the authenticated user's config."""
    user = await _get_authed_user(db, authorization)
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile or profile.config_json == "{}":
        return {}
    return json.loads(profile.config_json)


@router.put("/api/profile")
async def update_profile(
    body: dict,
    db: AsyncSession = Depends(get_db),
    authorization: str = Header(default=""),
):
    """Update the authenticated user's config."""
    user = await _get_authed_user(db, authorization)

    # Validate against MandevConfig
    try:
        MandevConfig.model_validate(body)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one()
    profile.config_json = json.dumps(body)
    await db.commit()
    return {"status": "ok"}


@router.get("/api/profile/{username}")
async def get_public_profile(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a user's public profile by username."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile or profile.config_json == "{}":
        raise HTTPException(status_code=404, detail="Profile not configured")

    config = json.loads(profile.config_json)
    config["username"] = user.username
    return config


@router.post("/api/config/validate")
async def validate_config(body: dict):
    """Validate a config dict without saving it."""
    try:
        MandevConfig.model_validate(body)
        return {"valid": True, "errors": []}
    except ValidationError as e:
        return {"valid": False, "errors": e.errors()}
```

**Step 4: Register the router in the app**

Update `api/mandev_api/app.py` to also include:
```python
from mandev_api.routers.profile import router as profile_router

# inside create_app():
app.include_router(profile_router)
```

**Step 5: Run tests to verify they pass**

Run: `uv run pytest api/tests/test_profile.py -v`
Expected: All PASS

**Step 6: Run full API test suite**

Run: `uv run pytest api/tests/ -v`
Expected: All PASS

**Step 7: Commit**

```bash
git add api/
git commit -m "feat(api): add profile and config validation endpoints"
```

---

## Task 7: CLI — Setup & Init Command

**Files:**
- Create: `cli/mandev_cli/main.py`
- Create: `cli/mandev_cli/config.py`
- Create: `cli/tests/__init__.py`
- Create: `cli/tests/test_init.py`

**Step 1: Write the failing test**

`cli/tests/test_init.py`:
```python
"""Tests for the mandev init command."""

from pathlib import Path

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()


def test_init_creates_toml(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["init", "--name", "Ada Lovelace"])
    assert result.exit_code == 0
    assert (tmp_path / ".mandev.toml").exists()


def test_init_content(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    runner.invoke(app, ["init", "--name", "Ada Lovelace", "--tagline", "Engineer"])
    content = (tmp_path / ".mandev.toml").read_text()
    assert "Ada Lovelace" in content
    assert "Engineer" in content


def test_init_no_overwrite(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text("existing")
    result = runner.invoke(app, ["init", "--name", "Ada"])
    assert result.exit_code != 0 or "already exists" in result.stdout.lower()
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest cli/tests/test_init.py -v`
Expected: FAIL — cannot import `mandev_cli.main`

**Step 3: Write the implementation**

`cli/mandev_cli/config.py`:
```python
"""CLI configuration: paths and defaults."""

from pathlib import Path

API_BASE_URL = "https://man.dev"
AUTH_FILE = Path.home() / ".config" / "mandev" / "auth.json"
```

`cli/mandev_cli/main.py`:
```python
"""mandev CLI — your manual, as a developer."""

from pathlib import Path

import typer
from rich.console import Console

app = typer.Typer(name="mandev", help="Your manual, as a developer.")
console = Console()

TEMPLATE = '''[profile]
name = "{name}"
{tagline_line}

[theme]
scheme = "dracula"
font = "JetBrains Mono"
mode = "dark"

[layout]
sections = ["bio", "skills", "projects", "experience", "links"]
'''


@app.command()
def init(
    name: str = typer.Option(..., prompt="Your name"),
    tagline: str = typer.Option("", prompt="Tagline (optional)"),
) -> None:
    """Scaffold a new .mandev.toml config file."""
    path = Path.cwd() / ".mandev.toml"
    if path.exists():
        console.print("[red]Error:[/] .mandev.toml already exists")
        raise typer.Exit(code=1)

    tagline_line = f'tagline = "{tagline}"' if tagline else ""
    content = TEMPLATE.format(name=name, tagline_line=tagline_line)
    path.write_text(content)
    console.print(f"[green]\u2713[/] Created .mandev.toml")
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest cli/tests/test_init.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add cli/
git commit -m "feat(cli): add init command with TOML scaffolding"
```

---

## Task 8: CLI — Login, Whoami, Push

**Files:**
- Create: `cli/tests/test_commands.py`
- Modify: `cli/mandev_cli/main.py`

**Step 1: Write the failing tests**

`cli/tests/test_commands.py`:
```python
"""Tests for login, whoami, push commands."""

import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()


def test_login_saves_token(tmp_path, monkeypatch):
    auth_file = tmp_path / "auth.json"
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"access_token": "fake-jwt"}

    with patch("mandev_cli.main.httpx.post", return_value=mock_response):
        result = runner.invoke(
            app, ["login", "--email", "ada@example.com", "--password", "secret"]
        )
    assert result.exit_code == 0
    assert auth_file.exists()
    data = json.loads(auth_file.read_text())
    assert data["access_token"] == "fake-jwt"


def test_whoami(tmp_path, monkeypatch):
    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "fake-jwt"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "email": "ada@example.com",
        "username": "ada",
    }

    with patch("mandev_cli.main.httpx.get", return_value=mock_response):
        result = runner.invoke(app, ["whoami"])
    assert result.exit_code == 0
    assert "ada" in result.stdout


def test_push(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    auth_file = tmp_path / "auth.json"
    auth_file.write_text(json.dumps({"access_token": "fake-jwt"}))
    monkeypatch.setattr("mandev_cli.main.AUTH_FILE", auth_file)

    # Create a valid config
    (tmp_path / ".mandev.toml").write_text(
        '[profile]\nname = "Ada"\n'
    )

    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "ok"}

    with patch("mandev_cli.main.httpx.put", return_value=mock_response):
        result = runner.invoke(app, ["push"])
    assert result.exit_code == 0
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest cli/tests/test_commands.py -v`
Expected: FAIL — commands don't exist

**Step 3: Add commands to main.py**

Append to `cli/mandev_cli/main.py`:

```python
import json
import httpx
from mandev_core import load_config
from mandev_cli.config import API_BASE_URL, AUTH_FILE


def _read_token() -> str | None:
    """Read the stored JWT token, or None."""
    if not AUTH_FILE.exists():
        return None
    data = json.loads(AUTH_FILE.read_text())
    return data.get("access_token")


@app.command()
def login(
    email: str = typer.Option(..., prompt="Email"),
    password: str = typer.Option(..., prompt="Password", hide_input=True),
) -> None:
    """Authenticate with man.dev."""
    resp = httpx.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
    )
    if resp.status_code != 200:
        console.print("[red]Error:[/] Invalid credentials")
        raise typer.Exit(code=1)

    AUTH_FILE.parent.mkdir(parents=True, exist_ok=True)
    AUTH_FILE.write_text(json.dumps(resp.json()))
    console.print("[green]\u2713[/] Logged in")


@app.command()
def whoami() -> None:
    """Show the currently logged-in user."""
    token = _read_token()
    if not token:
        console.print("[red]Error:[/] Not logged in. Run `mandev login` first.")
        raise typer.Exit(code=1)

    resp = httpx.get(
        f"{API_BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code != 200:
        console.print("[red]Error:[/] Session expired. Run `mandev login` again.")
        raise typer.Exit(code=1)

    data = resp.json()
    console.print(f"Logged in as [bold]{data['username']}[/] ({data['email']})")


@app.command()
def push() -> None:
    """Push local config to man.dev."""
    token = _read_token()
    if not token:
        console.print("[red]Error:[/] Not logged in. Run `mandev login` first.")
        raise typer.Exit(code=1)

    try:
        config = load_config(Path.cwd())
    except FileNotFoundError as e:
        console.print(f"[red]Error:[/] {e}")
        raise typer.Exit(code=1)

    console.print("\u00b7 Parsing config")
    console.print("\u00b7 Pushing to man.dev")

    resp = httpx.put(
        f"{API_BASE_URL}/api/profile",
        json=config.model_dump(),
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.status_code != 200:
        console.print(f"[red]Error:[/] Push failed ({resp.status_code})")
        raise typer.Exit(code=1)

    console.print("[green]\u2713[/] Published")
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest cli/tests/test_commands.py -v`
Expected: All PASS

**Step 5: Commit**

```bash
git add cli/
git commit -m "feat(cli): add login, whoami, push commands"
```

---

## Task 9: CLI — Preview & Validate

**Files:**
- Create: `cli/tests/test_preview.py`
- Modify: `cli/mandev_cli/main.py`

**Step 1: Write the failing tests**

`cli/tests/test_preview.py`:
```python
"""Tests for preview and validate commands."""

from typer.testing import CliRunner

from mandev_cli.main import app

runner = CliRunner()

VALID_TOML = """
[profile]
name = "Ada Lovelace"
tagline = "Analytical engine whisperer"

[[skills]]
name = "Python"
level = "expert"
"""

INVALID_TOML = """
[profile]
tagline = "Missing name"
"""


def test_preview(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(VALID_TOML)
    result = runner.invoke(app, ["preview"])
    assert result.exit_code == 0
    assert "Ada Lovelace" in result.stdout
    assert "SKILLS" in result.stdout or "skills" in result.stdout.lower()


def test_preview_no_config(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["preview"])
    assert result.exit_code != 0


def test_validate_valid(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(VALID_TOML)
    result = runner.invoke(app, ["validate"])
    assert result.exit_code == 0


def test_validate_invalid(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".mandev.toml").write_text(INVALID_TOML)
    result = runner.invoke(app, ["validate"])
    assert result.exit_code != 0
```

**Step 2: Run tests to verify they fail**

Run: `uv run pytest cli/tests/test_preview.py -v`
Expected: FAIL — commands don't exist

**Step 3: Add commands to main.py**

Append to `cli/mandev_cli/main.py`:

```python
from pydantic import ValidationError as PydanticValidationError
from rich.panel import Panel
from rich.text import Text


LEVEL_BARS = {
    "beginner": "\u2588" * 5 + "\u2591" * 15,
    "intermediate": "\u2588" * 10 + "\u2591" * 10,
    "advanced": "\u2588" * 15 + "\u2591" * 5,
    "expert": "\u2588" * 20,
}


@app.command()
def preview() -> None:
    """Render the profile in the terminal like a man page."""
    try:
        config = load_config(Path.cwd())
    except FileNotFoundError as e:
        console.print(f"[red]Error:[/] {e}")
        raise typer.Exit(code=1)

    p = config.profile
    name = p.name.upper()
    header = f"{name}(7){'man.dev Manual':^40}{name}(7)"
    console.print(header, style="bold")
    console.print()

    console.print("NAME", style="bold")
    tagline = f" \u2014 {p.tagline}" if p.tagline else ""
    console.print(f"       {p.name}{tagline}")
    console.print()

    if p.about:
        console.print("DESCRIPTION", style="bold")
        console.print(f"       {p.about}")
        console.print()

    if config.skills:
        console.print("SKILLS", style="bold")
        for skill in config.skills:
            bar = LEVEL_BARS.get(skill.level, "")
            console.print(f"       {skill.name:<15} {bar} {skill.level}")
        console.print()

    if config.projects:
        console.print("PROJECTS", style="bold")
        for proj in config.projects:
            desc = f"  {proj.description}" if proj.description else ""
            console.print(f"       {proj.name}{desc}")
        console.print()

    if config.experience:
        console.print("EXPERIENCE", style="bold")
        for exp in config.experience:
            end = exp.end or "present"
            console.print(f"       {exp.role} at {exp.company} ({exp.start}\u2013{end})")
            if exp.description:
                console.print(f"           {exp.description}")
        console.print()

    if config.links:
        console.print("SEE ALSO", style="bold")
        for link in config.links:
            console.print(f"       {link.label}: {link.url}")
        console.print()


@app.command()
def validate() -> None:
    """Validate the local config file."""
    try:
        load_config(Path.cwd())
        console.print("[green]\u2713[/] Config is valid")
    except FileNotFoundError as e:
        console.print(f"[red]Error:[/] {e}")
        raise typer.Exit(code=1)
    except PydanticValidationError as e:
        console.print("[red]\u2717[/] Config is invalid:")
        for err in e.errors():
            loc = " \u2192 ".join(str(x) for x in err["loc"])
            console.print(f"  {loc}: {err['msg']}")
        raise typer.Exit(code=1)
```

**Step 4: Run tests to verify they pass**

Run: `uv run pytest cli/tests/test_preview.py -v`
Expected: All PASS

**Step 5: Run full CLI test suite**

Run: `uv run pytest cli/tests/ -v`
Expected: All PASS

**Step 6: Commit**

```bash
git add cli/
git commit -m "feat(cli): add preview and validate commands"
```

---

## Task 10: Frontend — Astro Project Setup

**Files:**
- Create: `web/package.json`
- Create: `web/astro.config.mjs`
- Create: `web/tsconfig.json`
- Create: `web/tailwind.config.mjs`
- Create: `web/src/layouts/BaseLayout.astro`
- Create: `web/src/pages/index.astro`
- Create: `web/src/styles/global.css`
- Create: `web/public/favicon.svg`

**Step 1: Scaffold the Astro project**

Run:
```bash
cd /Users/wouter/Repositories/private/mandev
npm create astro@latest web -- --template minimal --no-install --typescript strict
cd web
npm install
npm install @astrojs/react @astrojs/tailwind react react-dom @types/react @types/react-dom tailwindcss
```

**Step 2: Configure Astro**

`web/astro.config.mjs`:
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'server',
});
```

**Step 3: Set up Tailwind with terminal defaults**

`web/tailwind.config.mjs`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Source Code Pro"', 'monospace'],
      },
      colors: {
        terminal: {
          bg: 'var(--bg)',
          fg: 'var(--fg)',
          accent: 'var(--accent)',
          dim: 'var(--dim)',
          border: 'var(--border)',
        },
      },
      maxWidth: {
        terminal: '80ch',
      },
    },
  },
  plugins: [],
};
```

**Step 4: Create global styles with CSS variables for themes**

`web/src/styles/global.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;700&family=Source+Code+Pro:wght@400;700&family=IBM+Plex+Mono:wght@400;700&family=Inconsolata:wght@400;700&family=Victor+Mono:ital,wght@0,400;0,700;1,400&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Dracula (default) */
:root, [data-scheme="dracula"] {
  --bg: #282a36;
  --fg: #f8f8f2;
  --accent: #bd93f9;
  --dim: #6272a4;
  --border: #44475a;
}

[data-scheme="monokai"] {
  --bg: #272822;
  --fg: #f8f8f2;
  --accent: #f92672;
  --dim: #75715e;
  --border: #3e3d32;
}

[data-scheme="gruvbox"] {
  --bg: #282828;
  --fg: #ebdbb2;
  --accent: #fabd2f;
  --dim: #928374;
  --border: #3c3836;
}

[data-scheme="nord"] {
  --bg: #2e3440;
  --fg: #d8dee9;
  --accent: #88c0d0;
  --dim: #4c566a;
  --border: #3b4252;
}

[data-scheme="solarized-dark"] {
  --bg: #002b36;
  --fg: #839496;
  --accent: #b58900;
  --dim: #586e75;
  --border: #073642;
}

[data-scheme="catppuccin"] {
  --bg: #1e1e2e;
  --fg: #cdd6f4;
  --accent: #cba6f7;
  --dim: #585b70;
  --border: #313244;
}

[data-scheme="tokyo-night"] {
  --bg: #1a1b26;
  --fg: #a9b1d6;
  --accent: #7aa2f7;
  --dim: #565f89;
  --border: #292e42;
}

[data-scheme="one-dark"] {
  --bg: #282c34;
  --fg: #abb2bf;
  --accent: #61afef;
  --dim: #5c6370;
  --border: #3e4451;
}

[data-scheme="github-dark"] {
  --bg: #0d1117;
  --fg: #c9d1d9;
  --accent: #58a6ff;
  --dim: #484f58;
  --border: #21262d;
}

[data-scheme="terminal-green"] {
  --bg: #0a0a0a;
  --fg: #00ff00;
  --accent: #00ff00;
  --dim: #008000;
  --border: #003300;
}

@layer base {
  * {
    box-sizing: border-box;
  }

  body {
    font-family: 'JetBrains Mono', monospace;
    background-color: var(--bg);
    color: var(--fg);
    line-height: 1.6;
    margin: 0;
    padding: 0;
  }

  ::selection {
    background-color: var(--accent);
    color: var(--bg);
  }
}

/* Blinking cursor */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.cursor-blink::after {
  content: '█';
  animation: blink 1s step-end infinite;
  color: var(--accent);
}

/* Terminal box borders */
.terminal-box {
  border: 1px solid var(--border);
  padding: 1rem;
  position: relative;
}

.terminal-box::before {
  content: attr(data-title);
  position: absolute;
  top: -0.7em;
  left: 1ch;
  padding: 0 0.5ch;
  background-color: var(--bg);
  color: var(--dim);
  font-size: 0.85em;
}
```

**Step 5: Create the base layout**

`web/src/layouts/BaseLayout.astro`:
```astro
---
interface Props {
  title: string;
  scheme?: string;
  font?: string;
}

const { title, scheme = 'dracula', font = 'JetBrains Mono' } = Astro.props;
---
<!doctype html>
<html lang="en" data-scheme={scheme}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} — man.dev</title>
    <style set:html={`body { font-family: '${font}', monospace; }`} />
  </head>
  <body class="min-h-screen">
    <slot />
  </body>
</html>
```

**Step 6: Create a placeholder landing page**

`web/src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="man.dev">
  <main class="max-w-terminal mx-auto px-4 py-16">
    <pre class="text-terminal-dim text-sm">$ man dev</pre>
    <h1 class="text-terminal-fg text-lg font-bold mt-4">
      MAN.DEV(1)<span class="text-terminal-dim">{'          '}Developer Manual{'          '}</span>MAN.DEV(1)
    </h1>
    <div class="mt-8">
      <p class="text-terminal-accent font-bold">NAME</p>
      <p class="pl-8">man.dev — your manual, as a developer</p>
    </div>
    <div class="mt-4">
      <p class="text-terminal-accent font-bold">DESCRIPTION</p>
      <p class="pl-8">Your dev profile is a config file.</p>
      <p class="pl-8">Everything else is just a view.</p>
    </div>
    <div class="mt-8 flex gap-4 pl-8">
      <a href="/signup" class="text-terminal-fg border border-terminal-border px-4 py-1 hover:bg-terminal-accent hover:text-terminal-bg transition-colors">[ GET STARTED ]</a>
      <a href="/demo" class="text-terminal-dim border border-terminal-border px-4 py-1 hover:text-terminal-fg transition-colors">[ VIEW DEMO ]</a>
    </div>
  </main>
</BaseLayout>
```

**Step 7: Verify it builds**

Run: `cd /Users/wouter/Repositories/private/mandev/web && npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add web/
git commit -m "feat(web): scaffold Astro project with terminal design system"
```

---

## Task 11: Frontend — Terminal Design Components

**Files:**
- Create: `web/src/components/TerminalBox.astro`
- Create: `web/src/components/TerminalButton.astro`
- Create: `web/src/components/TerminalInput.tsx`
- Create: `web/src/components/TerminalNav.astro`
- Create: `web/src/components/TypeWriter.tsx`
- Create: `web/src/components/SkillBar.astro`

**Step 1: Create TerminalBox**

`web/src/components/TerminalBox.astro`:
```astro
---
interface Props {
  title?: string;
  class?: string;
}
const { title, class: className = '' } = Astro.props;
---
<div class={`terminal-box ${className}`} data-title={title}>
  <slot />
</div>
```

**Step 2: Create TerminalButton**

`web/src/components/TerminalButton.astro`:
```astro
---
interface Props {
  href?: string;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost';
  class?: string;
}
const { href, type = 'button', variant = 'primary', class: className = '' } = Astro.props;

const baseClasses = 'font-mono px-4 py-1 border transition-colors cursor-pointer';
const variantClasses = variant === 'primary'
  ? 'border-terminal-accent text-terminal-accent hover:bg-terminal-accent hover:text-terminal-bg'
  : 'border-terminal-border text-terminal-dim hover:text-terminal-fg';
---
{href ? (
  <a href={href} class={`${baseClasses} ${variantClasses} ${className}`}>
    [ <slot /> ]
  </a>
) : (
  <button type={type} class={`${baseClasses} ${variantClasses} ${className}`}>
    [ <slot /> ]
  </button>
)}
```

**Step 3: Create TerminalInput (React, for interactivity)**

`web/src/components/TerminalInput.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react';

interface Props {
  label: string;
  name: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function TerminalInput({ label, name, type = 'text', value = '', onChange }: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label
      className="flex items-center gap-2 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-terminal-accent">$</span>
      <span className="text-terminal-dim">{label}:</span>
      <span className="relative flex-1">
        <input
          ref={inputRef}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="bg-transparent border-none outline-none text-terminal-fg w-full font-mono"
        />
        {focused && (
          <span className="cursor-blink absolute" />
        )}
      </span>
    </label>
  );
}
```

**Step 4: Create TypeWriter (React, for landing page)**

`web/src/components/TypeWriter.tsx`:
```tsx
import { useState, useEffect } from 'react';

interface Props {
  text: string;
  speed?: number;
  delay?: number;
}

export default function TypeWriter({ text, speed = 50, delay = 0 }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;

    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timeout);
  }, [displayed, started, text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="cursor-blink" />
      )}
    </span>
  );
}
```

**Step 5: Create SkillBar**

`web/src/components/SkillBar.astro`:
```astro
---
interface Props {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const { name, level } = Astro.props;

const widths = {
  beginner: '25%',
  intermediate: '50%',
  advanced: '75%',
  expert: '100%',
};
---
<div class="flex items-center gap-2">
  <span class="w-32 text-terminal-fg">{name}</span>
  <div class="flex-1 h-3 border border-terminal-border relative overflow-hidden">
    <div
      class="h-full bg-terminal-accent"
      style={`width: ${widths[level]}`}
    />
  </div>
  <span class="text-terminal-dim text-sm w-28">{level}</span>
</div>
```

**Step 6: Create TerminalNav**

`web/src/components/TerminalNav.astro`:
```astro
---
interface Props {
  active?: string;
}
const { active } = Astro.props;

const items = [
  { label: 'home', href: '/' },
  { label: 'login', href: '/login' },
  { label: 'signup', href: '/signup' },
];
---
<nav class="max-w-terminal mx-auto px-4 py-4 text-sm">
  <div class="flex items-center gap-1">
    {items.map((item, i) => (
      <>
        {i > 0 && <span class="text-terminal-dim">|</span>}
        <a
          href={item.href}
          class={`px-2 ${active === item.label ? 'text-terminal-accent' : 'text-terminal-dim hover:text-terminal-fg'}`}
        >
          {active === item.label ? '> ' : '  '}{item.label}
        </a>
      </>
    ))}
  </div>
</nav>
```

**Step 7: Verify it builds**

Run: `cd /Users/wouter/Repositories/private/mandev/web && npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add web/
git commit -m "feat(web): add terminal UI components (box, button, input, typewriter, nav, skill bar)"
```

---

## Task 12: Frontend — Landing Page

**Files:**
- Modify: `web/src/pages/index.astro`

**Step 1: Update the landing page with full terminal aesthetic**

Replace `web/src/pages/index.astro` with the full landing page using the components from Task 11. It should include:
- Terminal nav
- Typewriter hero: `$ man dev` then the man page header
- NAME, SYNOPSIS, DESCRIPTION sections
- A demo profile rendered inline (static)
- GET STARTED / VIEW DEMO buttons
- Feature highlights in terminal boxes

This page is the first impression — it should feel like opening a terminal.

**Step 2: Verify it builds and renders**

Run: `cd /Users/wouter/Repositories/private/mandev/web && npm run dev`
Check: `http://localhost:4321` in browser

**Step 3: Commit**

```bash
git add web/
git commit -m "feat(web): build landing page with terminal aesthetic"
```

---

## Task 13: Frontend — Auth Pages

**Files:**
- Create: `web/src/pages/login.astro`
- Create: `web/src/pages/signup.astro`
- Create: `web/src/components/AuthForm.tsx`

**Step 1: Create AuthForm React component**

`web/src/components/AuthForm.tsx` — a React form with TerminalInputs for email/password (and username for signup). On submit, POST to the API. Store JWT in localStorage. Redirect to `/dashboard` on success.

**Step 2: Create login and signup Astro pages**

Both use BaseLayout + TerminalNav + AuthForm. The login page shows:
```
$ mandev login
> email: _
> password: _
  [ LOGIN ]
```

The signup page shows:
```
$ mandev signup
> email: _
> username: _
> password: _
  [ SIGN UP ]
```

**Step 3: Verify it builds**

Run: `cd /Users/wouter/Repositories/private/mandev/web && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): add login and signup pages"
```

---

## Task 14: Frontend — Public Profile Page

**Files:**
- Create: `web/src/pages/[username].astro`

**Step 1: Create the profile page**

`web/src/pages/[username].astro` — fetches `GET /api/profile/{username}` at request time (SSR). Renders the config as a man page using the user's chosen theme and font. Structure:

```
USERNAME(7)              man.dev Manual             USERNAME(7)

NAME
       Full Name — tagline

DESCRIPTION
       About text

SKILLS
       Python ████████████████████ expert
       Rust   ████████████░░░░░░░░ intermediate

PROJECTS
       project-name  Description here

EXPERIENCE
       Role at Company (2024-01–present)
           Description

SEE ALSO
       GitHub: https://...
```

Uses `data-scheme` on `<html>` to apply the user's color scheme. Font loaded dynamically.

**Step 2: Handle 404**

If the API returns 404, render a terminal-styled 404 page:
```
$ man username
No manual entry for username
```

**Step 3: Verify it builds**

Run: `cd /Users/wouter/Repositories/private/mandev/web && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): add public profile page with man page rendering"
```

---

## Task 15: Frontend — Dashboard & Editor

**Files:**
- Create: `web/src/pages/dashboard.astro`
- Create: `web/src/components/Editor.tsx`
- Create: `web/src/lib/api.ts`

**Step 1: Create API helper**

`web/src/lib/api.ts` — thin wrapper around `fetch` that reads the JWT from `localStorage` and hits the FastAPI backend. Functions: `getProfile()`, `updateProfile(config)`, `getMe()`.

**Step 2: Create the Editor component**

`web/src/components/Editor.tsx` — React component that:
- Loads the user's config via `getProfile()`
- Renders a form with sections matching the config (profile, skills, projects, etc.)
- All inputs styled as terminal inputs
- Theme/font/scheme pickers as inline selects
- Live preview panel on the right (or below on mobile) showing the man page render
- Save button: `[ PUSH ]` — calls `updateProfile(config)`
- Toast on save: `✓ Config pushed`

**Step 3: Create the dashboard page**

`web/src/pages/dashboard.astro` — uses BaseLayout with a dashboard nav (`> editor | settings | logout`). Renders the Editor component as a React island.

**Step 4: Verify it builds**

Run: `cd /Users/wouter/Repositories/private/mandev/web && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add web/
git commit -m "feat(web): add dashboard with config editor and live preview"
```

---

## Task 16: Integration & Deployment Config

**Files:**
- Create: `Dockerfile` (for the API)
- Create: `docker-compose.yml` (API + Postgres for local dev)
- Create: `Makefile` (convenience commands)

**Step 1: Create Dockerfile for the API**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY core/ core/
COPY api/ api/
COPY pyproject.toml .
RUN pip install uv && uv sync --no-dev
CMD ["uv", "run", "uvicorn", "mandev_api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 2: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: mandev
      POSTGRES_PASSWORD: mandev
      POSTGRES_DB: mandev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      MANDEV_DATABASE_URL: postgresql+asyncpg://mandev:mandev@db/mandev
      MANDEV_SECRET_KEY: dev-secret-change-me
    depends_on:
      - db

volumes:
  pgdata:
```

**Step 3: Create Makefile**

```makefile
.PHONY: dev api web test

dev:          ## Start API + DB
	docker compose up -d db
	uv run uvicorn mandev_api.app:create_app --factory --reload --port 8000

web:          ## Start frontend dev server
	cd web && npm run dev

test:         ## Run all tests
	uv run pytest -v

install:      ## Install all dependencies
	uv sync
	cd web && npm install
```

**Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml Makefile
git commit -m "chore: add Docker, docker-compose, and Makefile for local dev"
```

---

## Summary

| Task | What | Commit message |
|------|------|----------------|
| 1 | Monorepo scaffolding | `chore: scaffold monorepo with core, api, cli packages` |
| 2 | Core models | `feat(core): add Pydantic config models with tests` |
| 3 | Core parser | `feat(core): add TOML/YAML config parser with tests` |
| 4 | API setup + DB | `feat(api): add FastAPI app with database models and health check` |
| 5 | Auth endpoints | `feat(api): add auth endpoints (signup, login, me) with JWT` |
| 6 | Profile endpoints | `feat(api): add profile and config validation endpoints` |
| 7 | CLI init | `feat(cli): add init command with TOML scaffolding` |
| 8 | CLI login/push | `feat(cli): add login, whoami, push commands` |
| 9 | CLI preview/validate | `feat(cli): add preview and validate commands` |
| 10 | Astro setup | `feat(web): scaffold Astro project with terminal design system` |
| 11 | UI components | `feat(web): add terminal UI components` |
| 12 | Landing page | `feat(web): build landing page with terminal aesthetic` |
| 13 | Auth pages | `feat(web): add login and signup pages` |
| 14 | Profile page | `feat(web): add public profile page with man page rendering` |
| 15 | Dashboard | `feat(web): add dashboard with config editor and live preview` |
| 16 | Deployment | `chore: add Docker, docker-compose, and Makefile for local dev` |
