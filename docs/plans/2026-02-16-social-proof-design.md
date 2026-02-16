# Social Proof Features — Design

**Goal:** Add trust signals and shareability to man.dev profiles, targeting individual developers who want a credible, shareable personal page.

**Features:** GitHub OAuth verification, Open Graph social cards, profile view counter.

---

## 1. GitHub OAuth Verification

User links their GitHub account via OAuth. The verified GitHub username is stored separately from the self-reported config value. When they match, the profile shows a verified badge.

### Flow

1. User clicks "Link GitHub" in the dashboard editor
2. Redirected to GitHub OAuth (`https://github.com/login/oauth/authorize`)
3. GitHub redirects back to `/api/auth/github/callback` with an authorization code
4. API exchanges code for access token, fetches GitHub username
5. Stores `github_username` and `github_token` on the user record
6. Profile page shows `[verified]` next to GitHub section when config `github.username` matches the OAuth-verified username

### API Changes

- `GET /api/auth/github` — redirects to GitHub OAuth with correct scopes (`read:user`)
- `GET /api/auth/github/callback?code=...` — exchanges code, stores credentials, redirects to dashboard
- `GET /api/profile/{username}` response gains `github_verified: bool` field

### DB Changes

- Add columns to users table: `github_username` (nullable string), `github_token` (nullable string, encrypted at rest)

### Editor Changes

- New "GitHub" subsection in the editor with:
  - "Link GitHub" button (when not linked)
  - "Connected as @username" status + "Unlink" button (when linked)

### Profile Page Changes

- When `github_verified` is true, show `[verified]` badge (accent color) next to the GitHub section header
- Badge is a simple styled span, no complex iconography

### Bonus

- Use the stored OAuth token for GitHub API calls instead of unauthenticated requests
- Eliminates rate limiting issues
- Enables access to private contribution counts

---

## 2. Open Graph Social Cards

When someone shares a man.dev profile URL on Twitter, Slack, Discord, or LinkedIn, a rich preview card appears.

### Meta Tags

Added to `[username].astro` `<head>`:

```html
<meta property="og:type" content="profile" />
<meta property="og:title" content="Alice Chen — man.dev" />
<meta property="og:description" content="builds reliable backend systems" />
<meta property="og:image" content="https://man.dev/alice.png" />
<meta property="og:url" content="https://man.dev/alice" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Alice Chen — man.dev" />
<meta name="twitter:description" content="builds reliable backend systems" />
<meta name="twitter:image" content="https://man.dev/alice.png" />
```

### PNG Endpoint

Most social platforms don't support SVG for OG images. Add `[username].png` that:

1. Generates the same SVG card as `[username].svg`
2. Converts to PNG using `resvg-js` (lightweight, no browser dependency)
3. Returns with `Content-Type: image/png` and `Cache-Control: public, max-age=3600`

### Dimensions

600x300 (same as existing SVG card). Twitter recommends 2:1 ratio for `summary_large_image`.

---

## 3. Profile View Counter

Simple, honest view count displayed on the profile page.

### DB Changes

New table `profile_views`:
- `username` (string, primary key component)
- `date` (date, primary key component)
- `count` (integer, default 0)

Daily aggregation — one row per user per day, not per visit. Keeps the table small.

### API Changes

- On `GET /api/profile/{username}`: increment today's count (upsert), return `view_count` (sum of all days) in the response
- Skip increment for known bot user-agents (Googlebot, Bingbot, Slackbot, etc.)

### Profile Page Changes

- Displayed near the man page footer, styled dim:
  ```
  viewed 1,247 times
  ```
- No analytics dashboard, no charts, no per-day breakdown. Just the number.

---

## Non-Goals

- Domain verification (future enhancement, not needed for MVP)
- Analytics dashboard or per-day breakdown
- Private/hidden view counts
- Rate limiting on view count increments (daily aggregation naturally handles this)
