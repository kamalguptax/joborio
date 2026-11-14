# Deploy on Hostinger shared hosting (static frontend)

**API (Laravel):** `https://joborio.sevenapps.in/backend/`  
**Frontend:** static files in `public_html` (no Node.js required)

## 1. Backend CORS (on server `backend/.env`)

```env
APP_URL=https://joborio.sevenapps.in/backend
FRONTEND_URL=https://joborio.sevenapps.in
CORS_ALLOWED_ORIGINS=https://joborio.sevenapps.in,https://www.joborio.sevenapps.in
```

```bash
php artisan config:clear && php artisan config:cache
```

## 2. Build static `dist` on your PC

```powershell
cd E:\upsidcnew\frontend
npm run reinstall
npm run build:dist
```

Output: **`frontend\dist\`** (HTML, JS, CSS, and **`.htaccess`**).

## 3. Upload

1. Upload **everything inside `dist/`** to Hostinger **`public_html`** (site root).
2. Keep Laravel in **`public_html/backend/`** (or your existing backend path).
3. Ensure **`.htaccess`** is present in `public_html` (enables `/p/username`, `/jobs/…`, etc.).

## 4. Verify

| Check | URL |
|-------|-----|
| Home | `https://joborio.sevenapps.in` |
| API | `https://joborio.sevenapps.in/backend/api/v1/health` |
| Login | No CORS errors in browser devtools |

## Notes

- Data loads from the **Laravel API** in the browser (shared hosting cannot run Next.js server).
- Dynamic URLs use Apache rewrites to shell pages; real IDs come from the address bar.
- For local dev without export: `npm run dev` (no `NEXT_OUTPUT_EXPORT`).
