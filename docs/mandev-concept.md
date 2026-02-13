# man.dev

**Your manual, as a developer.**

*Product Concept Document — February 2026*

---

## Vision

man.dev is a developer identity platform that treats your professional profile like code. Inspired by the Unix `man` command, it lets developers create, version, and publish a CV-like page entirely from the terminal. The website is just a rendered view of a config file you own.

The core philosophy: **your dev page is a config file. Everything else is just a view.**

## The Problem

Developers are underserved by existing professional profile platforms. LinkedIn is bloated, corporate, and disconnected from how developers actually work. GitHub profiles show code but not the person. Personal portfolio sites require web development effort and constant maintenance. There is no tool that lets a developer manage their professional identity the way they manage their code: from the terminal, version controlled, and composable.

## The Product

man.dev has three surfaces that all read from the same source of truth: a config file.

### Config File

The `.mandev.toml` or `.mandev.yaml` file (auto-detected) defines everything: content, layout, and theme. It lives in the developer's home directory or a dedicated repo. This file is the single source of truth for the entire platform.

```toml
# .mandev.toml

[profile]
name = "Ada Lovelace"
tagline = "Analytical engine whisperer"
about = "Pioneering algorithms since 1843."

[theme]
base = "monospace"
accent = "#ff5733"
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
```

### CLI (`mandev`)

The `mandev` CLI is the primary interface for power users. Built with Typer (Python), it manages the config file, authenticates with the hosted platform, and deploys changes.

```bash
mandev init              # scaffold .mandev.toml
mandev push              # sync to man.dev
mandev preview           # render in terminal
mandev add-skill python  # add a skill
mandev add-project       # add a project interactively
mandev stats             # show aggregated dev stats
mandev diff              # show career changelog
mandev publish           # deploy your page
```

### Web (man.dev)

The web interface renders the config as a beautiful, themed profile page. It also provides a visual editor for developers who prefer a GUI. Changes made on the web sync back to the config file.

## Output Formats

From a single config file, man.dev produces four distinct outputs:

| Format | Description |
|--------|-------------|
| `man.dev/username` | Themed web page — the primary public profile, customizable via themes and config overrides. |
| `curl man.dev/username` | Terminal-rendered profile — formatted like a real man page. Drop it in a README or share in Slack. |
| `man.dev/username.json` | JSON API — structured data for integrations, embeds, and third-party tools. |
| PDF export | Print-ready résumé — same data, professionally formatted for job applications. |

## Key Features

### Git-Backed Pages

Pages are version controlled. Developers can push their config to a Git repository and the page deploys automatically, just like code. Every push is a commit. Your professional identity has a history.

### Career Diff & Changelog

Auto-generated from config diffs with optional human-written summaries. Every change to your profile is tracked. The changelog surfaces as a timeline on your page: new job, new skill, new project. Developers can add release-note-style summaries to contextualize changes, or let the system generate them from the diff.

```markdown
# Auto-generated from git history:
## March 2026
- Added Rust to skills (level: intermediate)
- Joined Acme Corp as Senior Engineer
- Shipped man.dev v2.0

# With optional human summary:
## March 2026 — "New chapter"
Joined Acme Corp to lead their developer tools team.
```

### Aggregated Developer Stats

man.dev pulls data from external platforms and presents a living dashboard of a developer's activity. Launch scope covers GitHub (contributions, stars, top languages, repos) plus one package registry (PyPI or npm). Future integrations include crates.io, Docker Hub, and more.

### Authentication

The CLI supports two authentication methods:

- **API key:** For scripts, CI/CD pipelines, and automation. Generated from the web dashboard.
- **OAuth browser flow:** For interactive use. Running `mandev login` opens a browser window for authentication.

## Theme System

Themes control the visual presentation of the web page. Developers pick a base theme and can override any variable from the config file. The system sits between fully custom and fully opinionated: you choose a theme, then tweak colors, fonts, and spacing to make it yours.

Theme overrides live in the config alongside content:

```toml
[theme]
base = "monospace"        # community or built-in theme
accent = "#ff5733"        # override accent color
font = "JetBrains Mono"   # override font
mode = "dark"             # dark or light
radius = "0"              # border radius (0 for sharp)
```

## Developer Workflow

The ideal workflow never requires leaving the terminal:

```bash
mandev init                       # scaffold config
vim .mandev.toml                  # edit in your editor
mandev preview                    # check in terminal
git add . && git push             # page deploys
# or: mandev push                 # deploy without git
```

Casual users who prefer a GUI can use the web editor. Changes sync bidirectionally: web edits update the config, CLI pushes update the web.

## Business Model: Open Core

man.dev follows an open core model. The core is free and open source. The hosted platform adds convenience and premium features.

| Open Source (Free) | Hosted Free Tier | Hosted Pro / Teams |
|--------------------|------------------|--------------------|
| CLI (`mandev`) | `man.dev/username` URL | Custom domain |
| Config spec & parser | Web profile page | PDF export |
| Terminal renderer | Basic GitHub sync | Full stats dashboard |
| Self-hosted server | One theme | Premium themes |
| Community themes | JSON API | Analytics (page views) |
| | | Team directories |
| | | Theme marketplace |
| | | Priority support |

The open source core ensures developer trust and community contributions. The hosted product monetizes convenience: the `man.dev/username` URL, continuous GitHub sync, the stats pipeline, and team features.

## Competitive Landscape

| | LinkedIn | GitHub Profile | Personal Site | **man.dev** |
|---|:---:|:---:|:---:|:---:|
| Terminal-first | ✗ | ✗ | ✗ | **✓** |
| Version controlled | ✗ | ✗ | Possible | **✓** |
| Config-as-code | ✗ | ✗ | ✗ | **✓** |
| Auto stats | ✗ | Partial | ✗ | **✓** |
| PDF export | Limited | ✗ | Manual | **✓** |
| Open source | ✗ | ✗ | N/A | **✓** |

## Technical Overview

### Stack

- **CLI:** Python, Typer, httpx, rich (terminal rendering)
- **Backend:** Python (FastAPI or similar), PostgreSQL, Redis
- **Frontend:** SSR framework (Next.js, Astro, or similar) for profile pages
- **Config:** TOML / YAML parser with schema validation (Pydantic)
- **Git integration:** Webhook-based deploy on push
- **Stats pipeline:** Background workers pulling GitHub API, PyPI/npm APIs

### Architecture

The config file is parsed into a canonical internal representation (Pydantic models). All four output formats render from this representation. The hosted platform stores the canonical form in a database, syncing bidirectionally with git repos and the web editor. The CLI communicates with the hosted API using either API key or OAuth tokens.

## Launch Plan

### Phase 1: Foundation

- Config spec and Pydantic models
- `mandev init`, `push`, `preview` commands
- Terminal rendering (man page format)
- Basic web profile page with one default theme
- API key authentication

### Phase 2: Git & Stats

- Git-backed deploys (webhook on push)
- GitHub auto-sync (repos, contributions, languages)
- PyPI or npm stats integration
- Career changelog (auto-diff)
- OAuth browser login flow

### Phase 3: Polish & Monetize

- PDF/résumé export
- JSON API (`man.dev/username.json`)
- Theme system with overrides
- Custom domains (Pro)
- Analytics dashboard (Pro)
- Team pages

### Phase 4: Community

- Open source release of core
- Theme marketplace
- Community-contributed integrations
- Self-hosted documentation

---

*Your identity, version controlled.*
