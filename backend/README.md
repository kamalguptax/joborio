# JobOrio Backend (Laravel 12)

## Database: MySQL (XAMPP local)

Your setup uses **XAMPP MySQL** on port **3306** — not PostgreSQL.

### `.env`

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=joborio
DB_USERNAME=root
DB_PASSWORD=
```

### Steps

1. Start **MySQL** in XAMPP Control Panel.
2. Create database **`joborio`** in phpMyAdmin (`http://localhost/phpmyadmin`).
3. Optional for tests: create **`joborio_test`** (same server).
4. Run migrations with XAMPP PHP:

```powershell
cd E:\upsidcnew\backend
c:\xampp2\php\php.exe artisan config:clear
c:\xampp2\php\php.exe artisan migrate:fresh --seed
c:\xampp2\php\php.exe artisan serve
```

API: `http://127.0.0.1:8000/api/v1/health`

### Apache / cPanel (document root = `backend/`, not `public/`)

If the site is served as `https://your-domain/backend/` (without `/public` in the URL):

1. Deploy the full `backend/` folder; keep `public/` inside it.
2. Use the repo **`backend/.htaccess`** (rewrites into `public/` and 301s old `/backend/public/` links).
3. Set **`APP_URL`** to the API base **without** `/public`, e.g. `https://joborio.sevenapps.in/backend`.
4. Set frontend **`NEXT_PUBLIC_API_URL`** to the same base (e.g. `https://joborio.sevenapps.in/backend`).
5. Prefer pointing the vhost document root at **`backend/public`** when your host allows it (best practice).

Health check: `https://joborio.sevenapps.in/backend/api/v1/health` (or `/up`).

### Demo accounts (after seed)

- Admin: `admin@joborio.com` / `password`
- Employer: `employer@joborio.com` / `password`
- Publisher owner: `publisher@joborio.com` / `password` (username `demopub`)
- Publisher manager: `publisher.manager@joborio.com` / `password`

### OAuth

Copy `GOOGLE_*`, `LINKEDIN_*`, `FRONTEND_URL` from `.env.example`.

### Tests

```powershell
c:\xampp2\php\php.exe artisan test
```

Uses MySQL database `joborio_test` (create in phpMyAdmin if tests fail).

## Module D — PPR (Pay Per Registration)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/webhooks/ppr` | `X-Joborio-Webhook-Secret` or `Authorization: Bearer {secret}` |
| GET | `/api/v1/ppr/verify/{id}?token=` | Public — email verification link |

**Body (webhook):** `{ "token": "<tracking token>", "email": "user@example.com", "meta": {} }`

**Flow:** Webhook creates `pending_verification` → user hits verify URL → PPR earning in ledger (3-day hold by default).

**Env:** `JOBORIO_PPR_WEBHOOK_SECRET`, `JOBORIO_DEFAULT_PPR_RATE_USD`, `JOBORIO_PPR_ALLOW_NANO` (default `true` for dev; production should require **micro** tier per blueprint).

Listings support `ppr_rate_usd` (admin CRUD + ingest feed).

## Module M — Trust tiers + Module I — Auto payout

**Tiers (auto-evaluated daily):**

| Tier | Unlocks | Payout |
|------|---------|--------|
| nano | PPC | Manual admin batch |
| micro | PPC + PPR, 3-day PPC hold | Manual admin batch |
| mid+ | PPR (+ PPA later), auto-pay eligible | Weekly auto batch if `payout_method` set |

**Creator:** `PUT /api/v1/creator/payout-method` — `paypal`, `bank_transfer`, `stripe_connect`

**Admin payouts:**

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/payouts/preview?mode=all\|auto\|manual` | |
| POST | `/api/v1/admin/payouts/batches` | body/query `mode=manual\|auto` |
| POST | `/api/v1/admin/payouts/batches/{id}/complete` | Marks lines + earnings **paid** |

**Env:** `JOBORIO_AUTO_PAYOUT_ENABLED`, `JOBORIO_PPR_ALLOW_NANO` (default `false`; set `true` for local PPR on new creators), trust thresholds `JOBORIO_TRUST_*`.

Dashboard includes `trust_tier` progress object.

## Module C — Job & Course Management (implemented)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/listings` | Public — search, filters |
| GET | `/api/v1/listings/{id}` | Public |
| POST | `/api/v1/admin/listings` | Admin |
| PUT | `/api/v1/admin/listings/{id}` | Admin |
| DELETE | `/api/v1/admin/listings/{id}` | Admin (marks expired) |
| POST | `/api/v1/admin/listings/ingest` | Admin — run feed now |

**CLI:** `php artisan listings:ingest --sync-feeds`  
**Schedule:** ingest every 2 hours → refreshes creator feeds (blueprint Module C).

Feed file: `database/data/listings-feed.json`  
Env: `JOBORIO_LISTINGS_INGEST_URL` for remote JSON (optional).

### Public listing filters

`?search=&country_code=US&category=technology&type=job&is_remote=1&experience_level=mid&page=1`

## Module checklist

`docker compose up -d` starts MySQL 8 + Redis; use `DB_PASSWORD=root` and `DB_USERNAME=root` in `.env` for that container.
