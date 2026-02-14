# Curl Output & SVG Card Design

**Date:** 2026-02-14

## Goal

Make man.dev profiles accessible and shareable beyond the browser: beautiful terminal output via `curl` and embeddable SVG cards for GitHub READMEs.

## Feature 1: ANSI-Colored Curl Output

**Endpoint:** `GET /{username}` (existing `.txt.ts` route)

**Approach:** Content negotiation via User-Agent header. When the request comes from `curl`, `wget`, `httpie`, or similar CLI tools, serve ANSI-colored plain text. Browser requests continue to get the HTML page (Astro handles this via the `.astro` route taking priority).

**Detection:** Check `User-Agent` for known CLI patterns (`curl/`, `Wget/`, `HTTPie/`, `libfetch/`, `Go-http-client/`, `python-requests/`). Also respect `Accept: text/plain` header.

**ANSI formatting:**
- Section headers (NAME, SKILLS, etc.) — bold + accent color
- Name — bold
- Tagline, descriptions — dim
- Skill bars — colored (green/yellow/blue based on level)
- Links — underlined
- GitHub stats — colored numbers
- Man page header/footer — dim

**Content:** Upgrade `renderManPage()` to include GitHub stats (contributions, streak, languages, pinned repos) matching the HTML page sections.

**Plain text fallback:** Add `?plain` query param or `Accept: text/plain` without ANSI support to get the current uncolored output.

## Feature 2: Embeddable SVG Card

**Endpoint:** `GET /{username}.svg` (new `[username].svg.ts` route)

**Approach:** Server-side SVG generation using template strings. No external libraries needed — SVG is just XML.

**Card contents:**
- Name + tagline
- Top 3-5 skills with visual bars
- GitHub stats summary (stars, repos, contributions) if available
- Theme-aware colors pulled from the user's configured scheme

**Dimensions:** ~600x300px default, responsive via SVG viewBox.

**Theming:** Read the user's `theme.scheme` from their profile config. Map scheme names to the same CSS variable values used in `global.css` (accent, fg, bg, dim colors). Default to dracula.

**Caching:** Set `Cache-Control: public, max-age=3600` (1 hour). Include `ETag` based on profile last-modified.

**Usage:**
```markdown
![Profile](https://man.dev/alice.svg)
```

## Non-Goals

- No interactive SVG (no animations, no JS)
- No custom card layouts (single design)
- No PDF/image export (SVG only)
