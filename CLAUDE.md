# CLAUDE.md

> **Self-updating file.** Claude should update this file whenever it learns something new about the project — conventions, architecture decisions, gotchas, or user preferences. Keep it concise and useful.

## Project Overview

**man.dev** — developer profiles rendered as man pages. Config-as-code identity: write a `.mandev.toml`, push from the terminal, get a page at `you.man.dev`.

## Architecture

Monorepo with four packages:

| Package | Stack | Purpose |
|---------|-------|---------|
| `core/` | Python (Pydantic) | Shared models and validation |
| `api/` | Python (FastAPI) | REST API, SQLite database |
| `cli/` | Python (Click) | `mandev init` / `mandev push` CLI |
| `web/` | Astro + React + Tailwind | Landing page, dashboard, public profiles |

- **Package management:** `uv` (Python), `npm` (web)
- **Task runner:** `justfile`
- **Database:** SQLite (`mandev.db`)
- **Docker:** `docker-compose.yml` + `Dockerfile` for local dev

## Web Frontend

- **Framework:** Astro with React islands (`client:load` for interactive components)
- **Styling:** Tailwind CSS + CSS custom properties for theming
- **Font:** JetBrains Mono (primary), plus 7 other mono fonts available
- **Color schemes:** 10 terminal themes (Dracula default), each with dark + light variants, defined as CSS variables in `global.css`
- **Light/dark mode:** `data-mode` attribute on `<html>`, persisted to `localStorage` (`mandev-mode`), respects `prefers-color-scheme`. Inline script in `<head>` prevents flash.
- **Max content width:** `80ch` (`max-w-terminal` in Tailwind config)

### Key Components

- `TypeWriter.tsx` — typing animation with loop mode; accepts `prefix` as static text (e.g., `$` is rendered outside the component)
- `ModeToggle.tsx` — light/dark mode toggle (`--light`/`--dark` labels), hidden in floating nav until hover
- `ThemeSwitcher.tsx` — interactive color scheme picker
- `DiffToggle.tsx` — before/after comparison with overlapping rotated cards; click cards or buttons to swap
- `PixelAvatar.tsx` — avatar upload with image preview
- `TerminalNav.astro` — floating nav, logo centered, links reveal on hover (CSS class `floating-nav`)
- `DashboardNav.tsx` — React equivalent for authenticated pages
- `Editor.tsx` — TOML config editor on the dashboard

### Landing Page (`index.astro`)

- Full-viewport scroll-snapping sections (`scroll-snap-type: y mandatory`)
- Sections: Hero → Description → Synopsis → Examples (TOML) → Examples (Diff) → Options → Getting Started → Footer
- Scroll indicator arrows (↓) on all sections except the last two; hero arrow is a clickable `<button>`
- Hero uses `heroIn` keyframe animation on load
- Other sections use Intersection Observer (`in-view` class) for scroll-triggered reveals
- Alternating section backgrounds via `color-mix()` (`scroll-section-alt` class)

## Python

- Modern Python 3.10+ with type hints
- Docstrings in ReST format (no types in docstrings — that's what type hints are for)
- Tests via `pytest`

## User Preferences

- No emojis unless explicitly asked
- Keep responses short and concise
- Prefer editing existing files over creating new ones
