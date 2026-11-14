# Frontend Guide (Next.js)

The marketing UI lives in `frontend/` (Next.js 16 + Tailwind 4).

## Run locally

1. Backend: `D:\xampp1\php\php.exe artisan serve` (from `backend/`)
2. Frontend: `npm run dev` (from `frontend/`)
3. Copy `frontend/.env.local.example` → `.env.local`
4. Set `FRONTEND_URL=http://localhost:3000` in `backend/.env`

## Routes (implemented)

| Route | Module |
|-------|--------|
| `/signup`, `/login`, `/auth/callback` | A |
| `/p/[handle]` | B (SSR public creator page) |
| `/onboarding` | A creator registration |
| `/creator/dashboard` | F |
| `/jobs` | C listings |

Still to build: `/creator/earnings`, `/employer/*`, `/admin/*`, OG images, i18n.

## Env

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_NAME=JobOrio
```

## Design assets

Add images to `frontend/public/images/`. Hero and company logos are optional; listings load from the API.
