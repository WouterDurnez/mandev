# Curl Output & SVG Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ANSI-colored terminal output for `curl man.dev/alice` and embeddable SVG profile cards at `/alice.svg`.

**Architecture:** Two new features in the web frontend. Feature 1 upgrades the existing `[username].txt.ts` to detect CLI user agents and emit ANSI escape codes. Feature 2 adds a new `[username].svg.ts` Astro API route that generates dynamic SVG using template strings with colors from a scheme-to-hex map.

**Tech Stack:** Astro API routes (TypeScript), ANSI escape codes, SVG XML generation, no new dependencies.

---

### Task 1: Extract ANSI helpers into a shared utility

**Files:**
- Create: `web/src/lib/ansi.ts`

**Step 1: Create the ANSI helper module**

```typescript
// web/src/lib/ansi.ts

/** ANSI escape code helpers for terminal-colored output. */

const ESC = '\x1b[';

export const ansi = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  underline: `${ESC}4m`,
  // Foreground colors
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,
  gray: `${ESC}90m`,
};

/** Wrap text in bold. */
export function bold(text: string): string {
  return `${ansi.bold}${text}${ansi.reset}`;
}

/** Wrap text in dim. */
export function dim(text: string): string {
  return `${ansi.dim}${text}${ansi.reset}`;
}

/** Wrap text in a color. */
export function color(text: string, c: string): string {
  return `${c}${text}${ansi.reset}`;
}

/** Wrap text in bold + a color. */
export function boldColor(text: string, c: string): string {
  return `${ansi.bold}${c}${text}${ansi.reset}`;
}

/** Wrap text in underline. */
export function underline(text: string): string {
  return `${ansi.underline}${text}${ansi.reset}`;
}

const CLI_PATTERNS = [
  'curl/', 'Wget/', 'HTTPie/', 'libfetch/', 'Go-http-client/',
  'python-requests/', 'python-httpx/', 'node-fetch/', 'undici/',
];

/** Return true if the User-Agent looks like a CLI tool (curl, wget, etc.). */
export function isCLI(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CLI_PATTERNS.some((pattern) => userAgent.includes(pattern));
}
```

**Step 2: Commit**

```bash
git add web/src/lib/ansi.ts
git commit -m "feat: add ANSI escape code helpers"
```

---

### Task 2: Add GitHub stats interfaces to the txt route

The existing `[username].txt.ts` lacks the GitHub-related interfaces that `[username].astro` has. Add them so we can render GitHub stats in the text output.

**Files:**
- Modify: `web/src/pages/[username].txt.ts:42-50`

**Step 1: Add the missing interfaces**

After the existing `Layout` interface (line 40) and before `ProfileData` (line 42), add:

```typescript
interface GitHubLanguage {
  name: string;
  percentage: number;
  color: string;
}

interface GitHubRepo {
  name: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  url: string;
}

interface GitHubStatsData {
  total_stars: number;
  total_repos: number;
  followers: number;
  total_contributions: number;
  current_streak: number;
  longest_streak: number;
  languages: GitHubLanguage[];
  pinned_repos: GitHubRepo[];
  contributions: { date: string; count: number }[];
}

interface GitHubConfig {
  username: string;
  show_heatmap?: boolean;
  show_stats?: boolean;
  show_languages?: boolean;
  show_pinned?: boolean;
}
```

Then update the `ProfileData` interface to include:

```typescript
interface ProfileData {
  username?: string;
  profile?: Profile;
  skills?: Skill[];
  projects?: Project[];
  experience?: Experience[];
  links?: Link[];
  layout?: Layout;
  github?: GitHubConfig;
  github_stats?: GitHubStatsData | null;
}
```

**Step 2: Commit**

```bash
git add web/src/pages/[username].txt.ts
git commit -m "feat: add GitHub interfaces to txt route"
```

---

### Task 3: Add GitHub stats sections to the plain-text renderer

**Files:**
- Modify: `web/src/pages/[username].txt.ts:65-132` (the `renderManPage` function)

**Step 1: Add GitHub rendering after the sections loop**

After the `for (const section of sections)` loop ends (after line 127), add GitHub stats rendering before the footer line:

```typescript
  // GitHub stats (rendered after user-defined sections)
  const github = data.github;
  const stats = data.github_stats;
  if (stats) {
    if (github?.show_stats !== false) {
      lines.push('GITHUB');
      lines.push(`       Stars: ${stats.total_stars.toLocaleString()}  Repos: ${stats.total_repos.toLocaleString()}  Followers: ${stats.followers.toLocaleString()}  Contributions: ${stats.total_contributions.toLocaleString()}`);
      lines.push(`       Current streak: ${stats.current_streak} days  Longest: ${stats.longest_streak} days`);
      lines.push('');
    }

    if (github?.show_languages !== false && stats.languages.length > 0) {
      lines.push('LANGUAGES');
      for (const lang of stats.languages) {
        lines.push(`       ${lang.name} ${lang.percentage}%`);
      }
      lines.push('');
    }

    if (github?.show_pinned !== false && stats.pinned_repos.length > 0) {
      lines.push('PINNED REPOSITORIES');
      for (const repo of stats.pinned_repos) {
        lines.push(`       ${repo.name}  ★ ${repo.stars}  ⑂ ${repo.forks}`);
        if (repo.description) lines.push(`         ${repo.description}`);
      }
      lines.push('');
    }
  }
```

**Step 2: Verify the txt endpoint works**

Run: `curl http://localhost:4322/alice.txt`
Expected: Man page text with GITHUB, LANGUAGES, PINNED REPOSITORIES sections for alice.

**Step 3: Commit**

```bash
git add web/src/pages/[username].txt.ts
git commit -m "feat: add GitHub stats to plain-text renderer"
```

---

### Task 4: Add ANSI-colored renderer

**Files:**
- Modify: `web/src/pages/[username].txt.ts`

**Step 1: Import ANSI helpers and add colored renderer**

At the top, add:

```typescript
import { ansi, bold, dim, color, boldColor, underline, isCLI } from '../lib/ansi';
```

Add a new function `renderAnsiManPage` after `renderManPage`:

```typescript
function renderAnsiManPage(username: string, data: ProfileData): string {
  const profile = data.profile;
  if (!profile) {
    return `No manual entry for ${username}\n`;
  }

  const lines: string[] = [];
  const uname = username.toUpperCase();
  const sections = data.layout?.sections || ['bio', 'skills', 'projects', 'experience', 'links'];

  // Header
  lines.push(dim(`${uname}(7)  man.dev Manual  ${uname}(7)`));
  lines.push('');

  for (const section of sections) {
    if (section === 'bio') {
      lines.push(boldColor('NAME', ansi.cyan));
      lines.push(`       ${bold(profile.name)}${profile.tagline ? dim(` -- ${profile.tagline}`) : ''}`);
      lines.push('');
      if (profile.about) {
        lines.push(boldColor('DESCRIPTION', ansi.cyan));
        lines.push(`       ${dim(profile.about)}`);
        lines.push('');
      }
    }

    if (section === 'skills' && data.skills && data.skills.length > 0) {
      lines.push(boldColor('SKILLS', ansi.cyan));
      const maxNameLen = Math.max(...data.skills.map((s) => s.name.length));
      for (const skill of data.skills) {
        const paddedName = skill.name.padEnd(maxNameLen, ' ');
        const barColor = skill.level === 'expert' ? ansi.green
          : skill.level === 'advanced' ? ansi.cyan
          : skill.level === 'intermediate' ? ansi.yellow
          : ansi.gray;
        lines.push(`       ${bold(paddedName)} ${color(skillBar(skill.level), barColor)} ${dim(skill.level)}`);
      }
      lines.push('');
    }

    if (section === 'projects' && data.projects && data.projects.length > 0) {
      lines.push(boldColor('PROJECTS', ansi.cyan));
      for (const project of data.projects) {
        lines.push(`       ${bold(project.name)}`);
        if (project.description) lines.push(`         ${dim(project.description)}`);
        if (project.url) lines.push(`         ${underline(project.url)}`);
        if (!project.url && project.repo) lines.push(`         ${underline(project.repo)}`);
      }
      lines.push('');
    }

    if (section === 'experience' && data.experience && data.experience.length > 0) {
      lines.push(boldColor('EXPERIENCE', ansi.cyan));
      for (const exp of data.experience) {
        lines.push(`       ${bold(exp.role)} at ${bold(exp.company)} ${dim(`(${exp.start}-${exp.end || 'present'})`)}`);
        if (exp.description) lines.push(`         ${dim(exp.description)}`);
      }
      lines.push('');
    }

    if (section === 'links' && data.links && data.links.length > 0) {
      lines.push(boldColor('SEE ALSO', ansi.cyan));
      for (const link of data.links) {
        lines.push(`       ${dim(link.label + ':')} ${underline(link.url)}`);
      }
      lines.push('');
    }
  }

  // GitHub stats
  const github = data.github;
  const stats = data.github_stats;
  if (stats) {
    if (github?.show_stats !== false) {
      lines.push(boldColor('GITHUB', ansi.cyan));
      lines.push(`       ${dim('Stars:')} ${bold(stats.total_stars.toLocaleString())}  ${dim('Repos:')} ${bold(stats.total_repos.toLocaleString())}  ${dim('Followers:')} ${bold(stats.followers.toLocaleString())}  ${dim('Contributions:')} ${bold(stats.total_contributions.toLocaleString())}`);
      lines.push(`       ${dim('Current streak:')} ${bold(String(stats.current_streak))} ${dim('days')}  ${dim('Longest:')} ${bold(String(stats.longest_streak))} ${dim('days')}`);
      lines.push('');
    }

    if (github?.show_languages !== false && stats.languages.length > 0) {
      lines.push(boldColor('LANGUAGES', ansi.cyan));
      for (const lang of stats.languages) {
        lines.push(`       ${bold(lang.name)} ${dim(lang.percentage + '%')}`);
      }
      lines.push('');
    }

    if (github?.show_pinned !== false && stats.pinned_repos.length > 0) {
      lines.push(boldColor('PINNED REPOSITORIES', ansi.cyan));
      for (const repo of stats.pinned_repos) {
        lines.push(`       ${bold(repo.name)}  ${color('★ ' + repo.stars, ansi.yellow)}  ${dim('⑂ ' + repo.forks)}`);
        if (repo.description) lines.push(`         ${dim(repo.description)}`);
      }
      lines.push('');
    }
  }

  // Footer
  lines.push(dim(`man.dev  ${new Date().getFullYear()}  ${uname}(7)`));
  lines.push('');
  return lines.join('\n');
}
```

**Step 2: Commit**

```bash
git add web/src/pages/[username].txt.ts
git commit -m "feat: add ANSI-colored man page renderer"
```

---

### Task 5: Wire up content negotiation in the GET handler

**Files:**
- Modify: `web/src/pages/[username].txt.ts:134-163` (the `GET` handler)

**Step 1: Update the handler to detect CLI and choose renderer**

Replace the GET handler:

```typescript
export const GET: APIRoute = async ({ params, request }) => {
  const username = params.username;
  if (!username) {
    return new Response('Username is required\n', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const upstream = await fetch(`${API_URL}/api/profile/${username}`);
    if (!upstream.ok) {
      return new Response(`No manual entry for ${username}\n`, {
        status: upstream.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const data = (await upstream.json()) as ProfileData;
    const url = new URL(request.url);
    const forcePlain = url.searchParams.has('plain');
    const useAnsi = !forcePlain && isCLI(request.headers.get('user-agent'));

    const body = useAnsi
      ? renderAnsiManPage(username, data)
      : renderManPage(username, data);

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('Upstream profile service unavailable\n', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
};
```

**Step 2: Verify curl output**

Run: `curl http://localhost:4322/alice.txt`
Expected: ANSI-colored output with bold headers, colored skill bars, dim descriptions. Should look like a real man page in the terminal.

Run: `curl 'http://localhost:4322/alice.txt?plain'`
Expected: Plain text (no escape codes).

**Step 3: Commit**

```bash
git add web/src/pages/[username].txt.ts
git commit -m "feat: content negotiation for ANSI curl output"
```

---

### Task 6: Create color scheme map for SVG

**Files:**
- Create: `web/src/lib/schemes.ts`

**Step 1: Create the scheme color map**

Extract the CSS variable values from `web/src/styles/global.css` into a TypeScript map. Each scheme needs bg, fg, accent, dim, border colors (dark mode values — SVG cards use dark mode):

```typescript
// web/src/lib/schemes.ts

/** Color scheme definitions for SVG generation. Matches CSS variables in global.css (dark mode). */

export interface SchemeColors {
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  border: string;
}

export const schemes: Record<string, SchemeColors> = {
  dracula:        { bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9', dim: '#6272a4', border: '#44475a' },
  monokai:        { bg: '#272822', fg: '#f8f8f2', accent: '#f92672', dim: '#75715e', border: '#3e3d32' },
  gruvbox:        { bg: '#282828', fg: '#ebdbb2', accent: '#fabd2f', dim: '#928374', border: '#3c3836' },
  nord:           { bg: '#2e3440', fg: '#d8dee9', accent: '#88c0d0', dim: '#4c566a', border: '#3b4252' },
  'solarized-dark': { bg: '#002b36', fg: '#839496', accent: '#b58900', dim: '#586e75', border: '#073642' },
  catppuccin:     { bg: '#1e1e2e', fg: '#cdd6f4', accent: '#cba6f7', dim: '#585b70', border: '#313244' },
  'tokyo-night':  { bg: '#1a1b26', fg: '#a9b1d6', accent: '#7aa2f7', dim: '#565f89', border: '#292e42' },
  'one-dark':     { bg: '#282c34', fg: '#abb2bf', accent: '#61afef', dim: '#5c6370', border: '#3e4451' },
  'github-dark':  { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff', dim: '#484f58', border: '#21262d' },
  'terminal-green': { bg: '#0a0a0a', fg: '#00ff00', accent: '#00ff00', dim: '#008000', border: '#003300' },
};

export const DEFAULT_SCHEME = 'dracula';

export function getScheme(name?: string): SchemeColors {
  return schemes[name || DEFAULT_SCHEME] || schemes[DEFAULT_SCHEME];
}
```

**Step 2: Commit**

```bash
git add web/src/lib/schemes.ts
git commit -m "feat: add color scheme map for SVG generation"
```

---

### Task 7: Create the SVG card endpoint

**Files:**
- Create: `web/src/pages/[username].svg.ts`

**Step 1: Create the SVG route**

```typescript
import type { APIRoute } from 'astro';
import { getScheme } from '../lib/schemes';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

interface ProfileData {
  username?: string;
  profile?: { name: string; tagline?: string };
  theme?: { scheme?: string };
  skills?: { name: string; level: string }[];
  github_stats?: {
    total_stars: number;
    total_repos: number;
    total_contributions: number;
    followers: number;
  } | null;
}

const CARD_W = 600;
const CARD_H = 300;
const PAD = 24;
const FONT = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";

const fillMap: Record<string, number> = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1.0,
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCard(username: string, data: ProfileData): string {
  const c = getScheme(data.theme?.scheme);
  const profile = data.profile;
  const name = profile?.name || username;
  const tagline = profile?.tagline || '';
  const skills = (data.skills || []).slice(0, 5);
  const stats = data.github_stats;

  let y = PAD + 20;
  const lines: string[] = [];

  // Name
  lines.push(`<text x="${PAD}" y="${y}" fill="${c.fg}" font-size="18" font-weight="bold" font-family="${FONT}">${escapeXml(name)}</text>`);
  y += 22;

  // Tagline
  if (tagline) {
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.dim}" font-size="12" font-family="${FONT}">${escapeXml(tagline)}</text>`);
    y += 20;
  }

  y += 8;

  // Skills
  if (skills.length > 0) {
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.accent}" font-size="10" font-weight="bold" font-family="${FONT}">SKILLS</text>`);
    y += 16;
    const barW = 120;
    const barH = 8;
    for (const skill of skills) {
      const fill = fillMap[skill.level] || 0;
      // Skill name
      lines.push(`<text x="${PAD}" y="${y + 1}" fill="${c.fg}" font-size="10" font-family="${FONT}">${escapeXml(skill.name)}</text>`);
      // Bar background
      lines.push(`<rect x="${PAD + 130}" y="${y - 7}" width="${barW}" height="${barH}" rx="2" fill="${c.border}" />`);
      // Bar fill
      if (fill > 0) {
        lines.push(`<rect x="${PAD + 130}" y="${y - 7}" width="${Math.round(barW * fill)}" height="${barH}" rx="2" fill="${c.accent}" />`);
      }
      y += 18;
    }
  }

  // GitHub stats (bottom area)
  if (stats) {
    y = Math.max(y + 4, CARD_H - 50);
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.accent}" font-size="10" font-weight="bold" font-family="${FONT}">GITHUB</text>`);
    y += 16;
    const statItems = [
      `★ ${stats.total_stars.toLocaleString()}`,
      `repos: ${stats.total_repos.toLocaleString()}`,
      `contrib: ${stats.total_contributions.toLocaleString()}`,
      `followers: ${stats.followers.toLocaleString()}`,
    ];
    lines.push(`<text x="${PAD}" y="${y}" fill="${c.dim}" font-size="10" font-family="${FONT}">${statItems.join('  ·  ')}</text>`);
  }

  // man.dev watermark
  lines.push(`<text x="${CARD_W - PAD}" y="${CARD_H - 12}" fill="${c.dim}" font-size="10" font-family="${FONT}" text-anchor="end">man.dev/${escapeXml(username)}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="${CARD_W}" height="${CARD_H}" rx="8" fill="${c.bg}" stroke="${c.border}" stroke-width="1" />
${lines.join('\n')}
</svg>`;
}

export const GET: APIRoute = async ({ params }) => {
  const username = params.username;
  if (!username) {
    return new Response('Username is required', { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URL}/api/profile/${username}`);
    if (!upstream.ok) {
      return new Response('Profile not found', { status: upstream.status });
    }

    const data = (await upstream.json()) as ProfileData;
    return new Response(renderCard(username, data), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return new Response('Upstream profile service unavailable', { status: 502 });
  }
};
```

**Step 2: Verify**

Open in browser: `http://localhost:4322/alice.svg`
Expected: An SVG card with alice's name, tagline, skills with colored bars, and GitHub stats at the bottom.

**Step 3: Commit**

```bash
git add web/src/pages/[username].svg.ts
git commit -m "feat: add embeddable SVG profile card endpoint"
```

---

### Task 8: Add SVG link to the profile page output section

**Files:**
- Modify: `web/src/pages/[username].astro:368-380` (the Output section)

**Step 1: Add SVG link**

In the Output section (around line 368-380), add an SVG entry after the txt entry:

```astro
            <p>
              <span class="text-terminal-dim">svg:</span>{' '}
              <a href={`/${username}.svg`} class="text-terminal-accent hover:underline">/{username}.svg</a>
            </p>
```

**Step 2: Verify**

Open: `http://localhost:4322/alice`
Expected: Output section now shows json, text, and svg links.

**Step 3: Commit**

```bash
git add web/src/pages/[username].astro
git commit -m "feat: add SVG link to profile output section"
```

---

### Task 9: Manual verification of all endpoints

**No files changed.** Run these commands and visually verify:

```bash
# ANSI curl output (should show colors)
curl http://localhost:4322/alice.txt

# Plain text fallback (no escape codes)
curl 'http://localhost:4322/alice.txt?plain'

# SVG card (should render in browser)
open http://localhost:4322/alice.svg

# JSON still works
curl http://localhost:4322/alice.json | python3 -m json.tool | head -20

# Profiles without GitHub stats still work
curl http://localhost:4322/carol.txt

# SVG for user without GitHub stats
open http://localhost:4322/carol.svg
```

Verify all five seed profiles work: alice, bob, carol, dave, eve.

**Step 1: Commit the header overlap fix from earlier**

```bash
git add web/src/pages/[username].astro
git commit -m "fix: add top padding to profile page for fixed nav"
```
