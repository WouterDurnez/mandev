# CLAUDE.md

> **Self-updating file.** Claude should update this file whenever it learns something new about the project — conventions, architecture decisions, gotchas, or user preferences. Keep it concise and useful.

## Project Overview

**man.dev** — developer profiles rendered as man pages. Config-as-code identity: write a `.mandev.toml`, push from the terminal, get a page at `you.man.dev`.

## Architecture

Monorepo with four packages:

| Package | Stack | Purpose |
|---------|-------|---------|
| `core/` | Python (Pydantic) | Shared models and validation |
| `api/` | Python (FastAPI + Piccolo ORM) | REST API, PostgreSQL database |
| `cli/` | Python (Click) | `mandev init` / `mandev push` CLI |
| `web/` | Astro + React + Tailwind | Landing page, dashboard, public profiles |

- **Package management:** `uv` (Python), `npm` (web)
- **Task runner:** `justfile`
- **ORM:** Piccolo ORM with built-in migrations (`just migrate`, `just migration "desc"`)
- **Database:** PostgreSQL via Docker (`docker compose up -d db`), SQLite for tests
- **DB config:** `api/piccolo_conf.py` reads `MANDEV_DB_*` env vars (defaults match docker-compose.yml)
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
- `PixelAvatar.tsx` — avatar upload; stores original image via `onChange`, displays pixelated version by default, reveals original on hover. CSS pixelation on profile page via `.avatar-pixel-wrap` (24px render, scale(4) with `image-rendering: pixelated`)
- `TerminalNav.astro` — floating nav, logo centered, links reveal on hover (CSS class `floating-nav`)
- `DashboardNav.tsx` — React equivalent for authenticated pages; uses same `floating-nav` pattern as TerminalNav
- `Editor.tsx` — config editor on the dashboard; live-previews scheme/font/mode changes by updating `data-scheme`, `data-mode`, and `fontFamily` on `<html>`

### Landing Page (`index.astro`)

- Full-viewport scroll-snapping sections (`scroll-snap-type: y mandatory`)
- Sections: Hero → Description → Getting Started → Examples (TOML) → Examples (Diff) → Options → Footer
- Scroll indicator arrows (↓) on sections before Options; hero arrow is a clickable `<button>`
- Hero uses `heroIn` keyframe animation on load
- Other sections use Intersection Observer (`in-view` class) for scroll-triggered reveals
- Alternating section backgrounds via `color-mix()` (`scroll-section-alt` class)

### Social Proof Features

- **GitHub OAuth Verification:** Users link GitHub via OAuth (`/api/auth/github` → callback → store `github_username` + `github_token` on User model). Profile shows `[verified]` badge when OAuth username matches config `github.username`. Editor has link/unlink UI.
- **Open Graph Social Cards:** Profile pages include OG + Twitter Card meta tags. `[username].png` endpoint converts SVG card to PNG via `@resvg/resvg-js`.
- **Profile View Counter:** Daily-aggregated `profile_views` table (username + date composite). Bot user-agents are skipped. Total count shown near man page footer.
- **Env vars:** `MANDEV_GITHUB_OAUTH_CLIENT_ID`, `MANDEV_GITHUB_OAUTH_CLIENT_SECRET` (optional, enables OAuth flow)

### Multi-Format Profile Output

- `[username].json` — raw JSON profile data
- `[username].txt` — plain text or ANSI-colored man page (content negotiation via `User-Agent`; `?plain` forces plain text)
- `[username].svg` — embeddable SVG card (600x300, theme-aware via `schemes.ts`)
- `web/src/lib/ansi.ts` — ANSI escape code helpers, `isCLI()` user-agent detection
- `web/src/lib/schemes.ts` — color scheme map mirroring CSS variables for SVG generation

### Seed Data

- `scripts/seed.py` — seeds 6 users (alice, bob, carol, dave, eve, wouter) with profiles, GitHub stats, identicon avatars
- All demo passwords: `seed` (except wouter: `darksoul`)
- Pure Python identicon generator (no Pillow dependency)
- GitHub heatmap dates are relative to today (`date.today() - timedelta(days=364)`)

## Python

- Modern Python 3.10+ with type hints
- Docstrings in ReST format (no types in docstrings — that's what type hints are for)
- Tests via `pytest`

## User Preferences

- No emojis unless explicitly asked
- Keep responses short and concise
- Prefer editing existing files over creating new ones
