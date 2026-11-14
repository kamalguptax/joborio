---
name: backend
description: >-
  JobOrio Laravel API at /backend on production (joborio.sevenapps.in), Apache
  routing without /public, CORS, server .env, and frontend API URL wiring. Use
  when the user mentions /backend, sevenapps, Hostinger API, login CORS, or
  NEXT_PUBLIC_API_URL pointing at localhost.
---

# JobOrio `/backend` (Laravel API)

Production site: [https://joborio.sevenapps.in](https://joborio.sevenapps.in)  
API base (no `/public` in URL): **`https://joborio.sevenapps.in/backend`**

## URLs

| Purpose | URL |
|--------|-----|
| API root (JSON) | `https://joborio.sevenapps.in/backend/` |
| Health | `https://joborio.sevenapps.in/backend/api/v1/health` |
| Login | `POST /api/v1/auth/login` |
| Register | `POST /api/v1/auth/register` |

Local dev (optional): `http://127.0.0.1:8000` via `php artisan serve` — **not** used on the live static site.

## Server `backend/.env` (required)

```env
APP_URL=https://joborio.sevenapps.in/backend
FRONTEND_URL=https://joborio.sevenapps.in
CORS_ALLOWED_ORIGINS=https://joborio.sevenapps.in,https://www.joborio.sevenapps.in
```

Then on the server:

```bash
cd backend
php artisan config:clear
php artisan config:cache
```

## Apache (document root = `backend/`)

Repo includes `backend/.htaccess` — rewrites into `public/` so URLs never need `/public/index.php`.  
Old links to `/backend/public/...` should 301 to `/backend/...`.

## Frontend must not call localhost in production

- Build-time: `frontend/.env.production` and `frontend/.env.local` should set  
  `NEXT_PUBLIC_API_URL=https://joborio.sevenapps.in/backend`
- Runtime: `frontend/lib/config.ts` → `getApiBaseUrl()` — if the site is **not** on localhost but env still has `127.0.0.1`, use `{origin}/backend`.
- All fetches go through `getApiBaseUrl()` in `lib/api/client.ts` (not a stale baked-in localhost).

After API URL changes: **`npm run build:dist`** and re-upload `frontend/dist/`.

## Deploy layout (Hostinger)

| Path on host | Contents |
|--------------|----------|
| `public_html/` | Static `frontend/dist/*` + `.htaccess` |
| `public_html/backend/` | Full Laravel app (`vendor`, `public`, `.htaccess`, `.env`) |

## Verify

1. `GET https://joborio.sevenapps.in/backend/api/v1/health` → JSON with `ok` / service name  
2. Browser login on `https://joborio.sevenapps.in/login` → Network tab shows requests to **`.../backend/api/v1/...`**, not `127.0.0.1`  
3. No CORS errors on `api/v1/*`

## Demo users (after `php artisan db:seed`)

- Admin: `admin@joborio.com` / `password`
- Employer: `employer@joborio.com` / `password`
- Publisher owner: `publisher@joborio.com` / `password` (username `demopub`)
- Publisher manager: `publisher.manager@joborio.com` / `password`

## Code locations

- Routes: `backend/routes/api.php` (prefix `v1` → `/api/v1/...`)
- CORS: `backend/config/cors.php` (merges `FRONTEND_URL` + `CORS_ALLOWED_ORIGINS`)
- URL forcing: `backend/app/Providers/AppServiceProvider.php` (`APP_URL`)
- Docs: `docs/hostinger-deploy.md`, `backend/README.md`

## Tests (local CI, not production DB)

```powershell
cd backend
php artisan test
```

PHPUnit uses SQLite `:memory:` (`phpunit.xml`); production uses MySQL on the server.

## Common failures

| Symptom | Fix |
|--------|-----|
| "Unable to sign in. Check the API is running." | Rebuild frontend with correct `NEXT_PUBLIC_API_URL`; confirm health URL works |
| Requests to `127.0.0.1:8000` on live site | Fix `.env.local` / rebuild; rely on `getApiBaseUrl()` fallback |
| CORS blocked | Set `FRONTEND_URL` + `CORS_ALLOWED_ORIGINS` on server; `config:cache` |
| 404 on `/backend/api/...` | Check `backend/.htaccess`, `mod_rewrite`, folder layout |

## More detail

See [reference.md](reference.md) for env keys and OAuth redirect URIs.
