# JobOrio Frontend (Next.js)

UI designs live in this folder. The app talks to the Laravel API in `../backend`.

## Setup

```powershell
cd E:\upsidcnew\frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_APP_NAME` | `JobOrio` |

In `backend/.env`, set `FRONTEND_URL=http://localhost:3000` so OAuth redirects to `/auth/callback`.

## Assets

Place design images under `public/images/` (e.g. `creator-banner.png`, `companies/*.png`). The home hero works without them; company logos in Hot Jobs use initials until images exist.

## API client (`lib/api/`)

| Module | Covers |
|--------|--------|
| `auth.ts` | register, login, logout, me |
| `creator.ts` | onboarding, dashboard, listings, track-link, earnings, payout |
| `listings.ts` | public catalog |
| `admin.ts` | listings CRUD, ingest, fraud, payouts |
| `public.ts` | health, OAuth providers, PPR verify |
| `index.ts` | re-exports all |

Import from `@/lib/api` or individual modules.

## Admin UI

Login as `admin@joborio.com` → header **Admin** → `/admin/listings`, `/admin/fraud`, `/admin/payouts`.

## Wired routes

| Route | Purpose |
|-------|---------|
| `/`, `/about`, `/terms` | Marketing (your design) |
| `/login`, `/signup` | Email + Google/LinkedIn OAuth |
| `/auth/callback` | OAuth token handoff |
| `/onboarding` | Creator profile → API |
| `/jobs` | Listings from API |
| `/creator/dashboard` | Metrics, earnings summary, trust tier |
| `/creator/opportunities` | Copy tracked links per listing |
| `/creator/earnings` | Ledger table |
| `/creator/settings` | Payout method |
| `/jobs` | Marketplace browse + search |
| `/p/[handle]` | Public creator page (share, listings) |
| `/how-it-works`, `/faq`, `/contact`, `/privacy` | Marketing |

## API

All calls use `NEXT_PUBLIC_API_URL` + `/api/v1/...`. Auth token is stored in `localStorage` as `joborio_auth_token`.
