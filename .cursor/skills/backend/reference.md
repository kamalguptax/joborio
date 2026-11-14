# JobOrio backend reference

## API conventions

- JSON envelope: `{ "success": true, "data": ..., "meta": ... }` or `{ "success": false, "error": { "code", "message" } }`
- Auth: `Authorization: Bearer {sanctum_token}` after login/register
- Public syndication: `GET /api/v1/syndication/vigyapanam/jobs`

## Production `.env` snippets

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://joborio.sevenapps.in/backend

FRONTEND_URL=https://joborio.sevenapps.in
CORS_ALLOWED_ORIGINS=https://joborio.sevenapps.in,https://www.joborio.sevenapps.in

GOOGLE_REDIRECT_URI="${APP_URL}/api/v1/auth/google/callback"
LINKEDIN_REDIRECT_URI="${APP_URL}/api/v1/auth/linkedin/callback"
```

## Frontend env (build on PC)

```env
NEXT_PUBLIC_API_URL=https://joborio.sevenapps.in/backend
NEXT_PUBLIC_APP_URL=https://joborio.sevenapps.in
```

Local-only override (optional `frontend/.env.development.local`):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Artisan on server

```bash
php artisan migrate --force
php artisan db:seed   # demo data — only when appropriate
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

Queue/cron: see `backend/routes/console.php` for scheduled jobs (payouts, holds, ingest).
