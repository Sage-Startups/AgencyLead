# AgencyLead Radar

**An AI-powered lead scoring and outreach tool for US web designers, SEO agencies, and freelancers.**

AgencyLead Radar is a pre-revenue MVP built as a sellable SaaS asset. It helps agencies find local US businesses with weak online presence, score them as leads, and generate personalized outreach using AI.

---

## Product Overview

- Add or import US local business leads
- Score leads 0–100 based on online presence weaknesses
- Generate AI-powered audits and outreach (cold email, DM, call opener, follow-up)
- Save, filter, and export leads as CSV
- Capture waitlist signups from the public website
- Admin dashboard with waitlist management

**Positioning:** Pre-revenue MVP. Honest demo-only data. Suitable for listing on Flippa or private sale to a US buyer.

---

## US Market Positioning

Built for US agencies targeting local service businesses across cities including Austin TX, Miami FL, Phoenix AZ, Denver CO, Nashville TN, Chicago IL, Atlanta GA, Seattle WA, and more.

Target users: Web designers, SEO agencies, freelancers, marketing agencies, and local marketing consultants.

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark theme)
- **Prisma ORM 5** (PostgreSQL)
- **Neon Postgres** (via Vercel Marketplace)
- **OpenAI API** (gpt-4o-mini)
- **bcryptjs** (password hashing)
- **jose** (JWT sessions)
- **PapaParse** (CSV import/export)

---

## Features Included

- Public homepage, pricing, waitlist, and demo pages
- Simple database-backed authentication (no OAuth, no Supabase)
- Dashboard with stats, recent leads, and top opportunities
- Lead Scanner with search, filter, add, edit, delete, status update
- Lead detail page with AI audit generation
- CSV import (validate required columns, show preview)
- CSV export (full lead + audit data)
- AI audit: summary, issues, cold email, DM, call opener, follow-up
- Saved leads management
- Admin dashboard (waitlist, stats, activity log)
- 25 demo leads pre-seeded across US cities and niches

## Features Deliberately Excluded

- Supabase (not used anywhere)
- OAuth / Magic links
- Stripe payments
- Email sending / cold email automation
- Google/Maps/LinkedIn scraping
- Team accounts
- White-label PDF reports
- Webhooks / Zapier

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo>
cd AgencyLead
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL=postgresql://...   # Your Neon Postgres connection string
OPENAI_API_KEY=sk-...           # Your OpenAI API key (optional)
APP_SECRET=...                  # Random secret (openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create the database schema

This project uses `prisma db push` (no migration files needed) to create tables
from `prisma/schema.prisma`:

```bash
npx prisma db push
```

### 4. Seed demo data

```bash
npm run db:seed
```

This creates:
- Admin: `admin@agencyleadradar.com` / `admin123`
- Demo user: `demo@agencyleadradar.com` / `demo123`
- 25 US local business demo leads

> The seed is **idempotent** — if the demo user already has leads, it skips
> re-seeding so you never end up with duplicates.

### 5. Start development server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Vercel Deployment

### 1. Create Neon Postgres via Vercel Marketplace

1. Go to your Vercel project → **Storage** tab
2. Click **Create Database** → select **Neon Postgres**
3. Copy the `DATABASE_URL` connection string
4. Add it to your Vercel environment variables

### 2. Set environment variables in Vercel

Set these **before the first deploy** (the build connects to the database):

```
DATABASE_URL        = (from Neon)        # REQUIRED — build fails without it
APP_SECRET          = (random secret)    # REQUIRED — generate with: openssl rand -base64 32
OPENAI_API_KEY      = sk-...              # Optional — needed only for AI audit generation
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
ADMIN_EMAIL         = you@yourcompany.com # Recommended — your own admin login
ADMIN_PASSWORD      = (a strong password) # Recommended — rotates on each deploy
```

> **`APP_SECRET` is required in production.** The app throws if it is missing,
> rather than signing sessions with an insecure default.
>
> **`OPENAI_API_KEY` is optional.** Everything except AI audit generation works
> without it. If it's unset, the "Generate AI Audit" button returns a clear
> "not configured" message instead of failing silently.
>
> **Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before your first deploy.** They default
> to `admin@agencyleadradar.com` / `admin123` (public in this repo). The seed
> re-applies the password on every deploy, so changing `ADMIN_PASSWORD` and
> redeploying rotates your admin login. The admin area can read waitlist
> signups (real emails), so do not leave the default password in production.

### 3. Deploy

```bash
git push origin main
```

Vercel auto-deploys on push. The build command provisions and seeds the database
automatically:

```
prisma generate && prisma db push && prisma db seed && next build
```

- `prisma db push` creates the tables from the schema (no migration files).
- `prisma db seed` loads the admin user, demo user, and 25 demo leads.
  It is idempotent, so redeploys never duplicate data.

No manual migration or seeding step is required after deploy.

---

## Prisma Setup

Schema: `prisma/schema.prisma`

Models:
- `User` — auth users with roles (user / admin)
- `Lead` — local business leads with scoring fields
- `AiAudit` — AI-generated audits linked to leads
- `WaitlistSignup` — public waitlist submissions
- `ImportBatch` — CSV import history
- `ActivityLog` — platform activity events

### Schema commands

```bash
npx prisma db push      # Create/update tables from schema (used in dev & deploy)
npx prisma generate     # Regenerate Prisma client
npx prisma studio       # Browse database in browser
npm run db:seed         # Load admin user, demo user, and 25 demo leads (idempotent)
```

This project uses `prisma db push` rather than migration files, which keeps
setup simple for a single-environment MVP. To adopt versioned migrations later,
run `npx prisma migrate dev --name init` and switch the build to `migrate deploy`.

---

## OpenAI Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local` as `OPENAI_API_KEY=sk-...`
3. The app uses `gpt-4o-mini` for cost efficiency
4. AI audit generation costs ~$0.001–0.003 per lead

> **Optional feature.** The OpenAI key powers only the "Generate AI Audit"
> button. The rest of the app — lead scanner, scoring, CSV import/export,
> saved leads, waitlist, and admin — works fully without it. If the key is
> unset, the audit endpoint returns a clear "not configured" message rather
> than erroring.

---

## Demo Credentials

```
Demo user:  demo@agencyleadradar.com / demo123
Admin:      admin@agencyleadradar.com / admin123
```

Public demo page: `/demo` · Login page: `/login`

---

## Security & Demo Notes

- **The public demo account is read-only.** Anyone using the `/demo` login shares
  one account, so adding, editing, deleting, and importing leads are blocked for
  it (the API returns a clear message). This keeps the shared demo dataset from
  being vandalized. Real accounts have full access.
- **Change the admin password.** See `ADMIN_EMAIL` / `ADMIN_PASSWORD` above. The
  defaults are public in this repo.
- **AI audit is rate-limited** (5 generations per user per 10 minutes) so the
  public demo can't be used to run up your OpenAI bill. For full protection,
  also set a hard monthly spend cap on your key in the OpenAI dashboard.

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Public homepage |
| `/pricing` | Pricing page (USD) |
| `/waitlist` | Waitlist signup form |
| `/demo` | Demo access page with credentials |
| `/login` | Email/password login form |
| `/dashboard` | Main dashboard |
| `/dashboard/leads` | Lead Scanner |
| `/dashboard/leads/[id]` | Lead detail + AI audit |
| `/dashboard/saved` | Saved leads |
| `/admin` | Admin dashboard |

---

## Buyer Handover Notes

This is an honest pre-revenue MVP. It includes:
- Clean, working codebase ready for Vercel deployment
- Neon Postgres database schema provisioned automatically on deploy (`prisma db push`)
- 25 demo leads auto-seeded on deploy for demonstrating the product
- AI outreach generation via OpenAI
- Public website explaining the product clearly
- Waitlist capture saving to database
- Admin area for managing signups

**What a buyer needs to do after purchase:**
1. Create a Vercel account and project
2. Connect Neon Postgres from Vercel Marketplace
3. Set the environment variables (`DATABASE_URL` and `APP_SECRET` are required;
   `OPENAI_API_KEY` is optional for AI audits; set `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
4. Deploy — the build automatically creates the schema (`prisma db push`) and
   seeds demo data (`prisma db seed`)
5. Log in at `/login` with your admin credentials, or use the demo button at `/demo`
6. Change the admin password and set an OpenAI spend cap before going public

**No real revenue, no real customers, no fake testimonials.** This is a pre-revenue asset built for demonstration and resale purposes.

---

## Roadmap (Not Built)

- Stripe billing integration
- White-label PDF reports
- Team accounts and multi-workspace
- Google Business Profile API integration
- Bulk outreach campaign tools
- GoHighLevel / Zapier integrations
- Email warm-up and deliverability tools
- PageSpeed API integration for live site scores
