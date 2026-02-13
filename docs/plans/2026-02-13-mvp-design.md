# man.dev MVP Design

*Approved 2026-02-13*

---

## Vision

A developer identity platform where your profile is a config file. Terminal-first aesthetic. Two surfaces: a Python CLI and a web app — both reading/writing the same config.

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  CLI     │────>│  FastAPI API  │<────│  Astro +   │
│ (Typer)  │     │  (Python)    │     │  React Web │
└──────────┘     └──────┬───────┘     └────────────┘
      │                 │
      │           ┌─────v─────┐
      │           │ Postgres  │
      └──────────>│           │
   (shared core)  └───────────┘
```

Three packages + one frontend:

```
mandev/
├── core/              # mandev-core: Pydantic models, config parser
├── api/               # FastAPI backend
├── cli/               # Typer CLI
├── web/               # Astro + React frontend
└── docs/
```

`core` is imported by `api` and `cli`. `web` is a separate JS/TS project.

## Config Spec

Single `.mandev.toml` (or `.mandev.yaml`) file:

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
sections = ["bio", "skills", "projects", "experience", "links"]

[[skills]]
name = "Python"
level = "expert"

[[projects]]
name = "man.dev"
repo = "https://github.com/..."
description = "Your manual, as a developer."

[[experience]]
role = "Senior Engineer"
company = "Acme Corp"
start = "2024-01"
description = "Leading developer tools."

[[links]]
label = "GitHub"
url = "https://github.com/ada"
icon = "github"
```

Parsed by `mandev-core` into Pydantic models. Both CLI and API use the same models.

## Core Models

```python
class Profile(BaseModel):
    name: str
    tagline: str | None
    about: str | None
    avatar_url: str | None

class Skill(BaseModel):
    name: str
    level: Literal["beginner", "intermediate", "advanced", "expert"]

class Project(BaseModel):
    name: str
    repo: str | None
    url: str | None
    description: str | None

class Experience(BaseModel):
    role: str
    company: str
    start: str
    end: str | None
    description: str | None

class Link(BaseModel):
    label: str
    url: str
    icon: str | None

class Theme(BaseModel):
    scheme: str = "dracula"
    font: str = "JetBrains Mono"
    mode: Literal["dark", "light"] = "dark"
    accent: str | None = None

class Layout(BaseModel):
    sections: list[str] = ["bio", "skills", "projects", "experience", "links"]

class MandevConfig(BaseModel):
    profile: Profile
    theme: Theme = Theme()
    layout: Layout = Layout()
    skills: list[Skill] = []
    projects: list[Project] = []
    experience: list[Experience] = []
    links: list[Link] = []
```

## Backend (FastAPI)

### Endpoints

```
POST /api/auth/signup         # email + password
POST /api/auth/login          # returns JWT
GET  /api/auth/me             # current user

GET  /api/profile             # own config (authed)
PUT  /api/profile             # update config (authed)
GET  /api/profile/{username}  # public profile

POST /api/config/validate     # validate config, return errors
```

### Database (Postgres)

```sql
users:    id, email, password_hash, username, created_at
profiles: user_id, config_json, updated_at
```

Auth: JWT, stored client-side. No OAuth for MVP.

## CLI (`mandev`)

### Commands

```
mandev init          # scaffold .mandev.toml interactively
mandev preview       # render man-page-style profile in terminal (Rich)
mandev validate      # parse + validate config, show errors
mandev login         # email + password -> stores JWT in ~/.config/mandev/auth.json
mandev push          # parse config -> PUT /api/profile
mandev whoami        # show current user
```

### Config resolution

Looks for `.mandev.toml` or `.mandev.yaml` in cwd, then `~/.config/mandev/`. First match wins.

### Auth storage

JWT stored in `~/.config/mandev/auth.json`.

## Frontend (Astro + React)

### Modes

1. **Public profiles** (`man.dev/{username}`) — Astro SSR, styled as man pages
2. **Dashboard** (`man.dev/dashboard`) — React SPA for config editing

### Pages

- `/` — Landing page (terminal-style hero)
- `/{username}` — Public profile (man page rendering)
- `/login`, `/signup` — Auth
- `/dashboard` — Config editor (authed)

## Terminal UI Design System

Everything looks and feels like a terminal emulator.

### Window chrome

ASCII box-drawing borders for all panels and cards. Title bars on sections.

### Typography

Monospace only. No text > 18px. Hierarchy through color, weight, and prefixes (`$`, `>`, `#`). Section headers ALL CAPS like man pages (`NAME`, `SYNOPSIS`, `SKILLS`).

### Fonts (user-selectable)

JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Cascadia Code, Inconsolata, Hack, Victor Mono.

### Color schemes (user-selectable)

| Scheme | Background | Foreground | Accent |
|--------|-----------|------------|--------|
| dracula | `#282a36` | `#f8f8f2` | `#bd93f9` |
| monokai | `#272822` | `#f8f8f2` | `#f92672` |
| gruvbox | `#282828` | `#ebdbb2` | `#fabd2f` |
| nord | `#2e3440` | `#d8dee9` | `#88c0d0` |
| solarized-dark | `#002b36` | `#839496` | `#b58900` |
| catppuccin | `#1e1e2e` | `#cdd6f4` | `#cba6f7` |
| tokyo-night | `#1a1b26` | `#a9b1d6` | `#7aa2f7` |
| one-dark | `#282c34` | `#abb2bf` | `#61afef` |
| github-dark | `#0d1117` | `#c9d1d9` | `#58a6ff` |
| terminal-green | `#0a0a0a` | `#00ff00` | `#00ff00` |

Each scheme defines `bg`, `fg`, `accent`, `dim`, `border`. Light variants for each.

### Interactive elements

- Buttons: `[ DEPLOY ]` — bracketed, no fill
- Inputs: `$ _` prompt style with blinking cursor
- Navigation: `> profile | editor | settings` — pipe-separated
- Toasts: stdout-style lines

### Animations

Typing effects, cursor blink, line-by-line content reveal. No fades or slides.

### Layout

Max 80ch width for profile content. Single-column. Generous line-height.

## Deployment

- **API**: Docker container on Hetzner VPS (~$4/mo) or Railway
- **Frontend**: Vercel or Cloudflare Pages (free tier)
- **Database**: Postgres on the same VPS, or Neon/Supabase free tier

## Out of Scope (Post-MVP)

- Git-backed deploys / webhooks
- GitHub stats integration
- PDF export
- Custom domains
- OAuth login
- Career changelog / diff
- Analytics dashboard
- Team pages
- Theme marketplace
