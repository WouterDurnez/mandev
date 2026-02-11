# man.dev - Deployment Guide

## Quick Start (Local Dev)

```bash
# Install deps (use bun if available, npm works too)
bun install  # or: npm install

# Start dev server
bun run dev  # or: npm run dev

# Open http://localhost:5173
```

## Demo Pages

- Landing: http://localhost:5173/
- Demo profile (Terminal theme): http://localhost:5173/janedev
- Demo profile (Dracula theme): http://localhost:5173/demo
- Dashboard: http://localhost:5173/dashboard (log in first)
- Editor: http://localhost:5173/editor/profile-1 (log in first)
- 404: http://localhost:5173/anyname

## Deploy to Cloudflare (Free Tier)

### 1. Buy man.dev domain
- Register at Cloudflare Registrar, Namecheap, or Porkbun
- .dev domains typically run $10-15/year

### 2. Prerequisites
```bash
npm install -g wrangler
wrangler login
```

### 3. Create D1 Database
```bash
wrangler d1 create mandev-db
# Copy the database_id from output into wrangler.toml
```

### 4. Initialize Database Schema
```bash
wrangler d1 execute mandev-db --file=./db/schema.sql
```

### 5. Create KV Namespace
```bash
wrangler kv:namespace create SESSIONS
# Copy the id from output into wrangler.toml
```

### 6. Set Secrets
```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 7. Build & Deploy
```bash
npm run build
wrangler pages deploy dist
```

### 8. Custom Domain
In Cloudflare dashboard: Pages > man-dev > Custom domains > Add man.dev

## Stripe Setup

1. Create a Stripe account
2. Create Product: "man.dev Pro" ($7/month or $69/year)
3. Copy Price ID into `functions/api/stripe/checkout.ts`
4. Set up webhook: `https://man.dev/api/stripe/webhook`
5. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Architecture

```
Frontend (Cloudflare Pages)
  └── React + Mantine SPA
  └── Vite build → static assets

Backend (Cloudflare Pages Functions)
  └── /api/auth/*      - Authentication
  └── /api/pages/*     - Profile CRUD
  └── /api/links/*     - Link CRUD
  └── /api/profile/*   - Public profiles + analytics
  └── /api/stripe/*    - Payment handling

Data
  └── Cloudflare D1    - Main database (SQLite)
  └── Cloudflare KV    - Session storage
```

## Cost Breakdown

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| Pages | Unlimited sites, 500 builds/mo | ~20 builds/mo |
| Workers | 100k req/day | Plenty |
| D1 | 5M rows read/day, 100k writes/day | Plenty |
| KV | 100k reads/day, 1k writes/day | Plenty |
| Domain | ~$12/year (man.dev) | One-time setup |

**Total hosting: $0/month** (+ ~$12/year for domain)

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free (man) | $0 | 1 page, 5 links, 6 themes, GitHub integration |
| Pro (man -v) | $7/mo or $69/yr | Unlimited, analytics, custom domain, projects, no branding |

- Stripe fees: 2.9% + $0.30/transaction
- Net per Pro user: ~$6.50/mo
- Break-even on domain: 2 Pro subscribers
- 100 Pro users = ~$650/mo passive income
