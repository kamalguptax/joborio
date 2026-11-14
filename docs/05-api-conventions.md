# API Conventions

Base: `http://127.0.0.1:8000/api/v1` · JSON: `{ success, data, meta? }` · errors: `{ success: false, error: { code, message } }`

Auth header: `Authorization: Bearer {sanctum_token}`

## Health & catalog

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | — |
| GET | `/niches` | — |
| GET | `/listings` | — |
| GET | `/listings/{id}` | — |

## Auth

| Method | Path |
|--------|------|
| GET | `/auth/providers` |
| GET | `/auth/{google\|linkedin}/redirect` |
| GET | `/auth/{google\|linkedin}/callback` → redirects to `FRONTEND_URL/auth/callback?token=` |
| POST | `/auth/register`, `/auth/login` |
| POST | `/auth/logout`, GET `/auth/me` | Sanctum |

## Public creator (Module B)

| Method | Path |
|--------|------|
| GET | `/public/creators/{handle}` | Listings include `tracked_url` |

## Tracking & PPR (Module D)

| Method | Path |
|--------|------|
| GET | `/r/{token}` | Web route — PPC redirect |
| POST | `/webhooks/ppr` | `X-Joborio-Webhook-Secret` |
| GET | `/ppr/verify/{registration}?token=` | Email verification |

## Creator (Sanctum)

| Method | Path |
|--------|------|
| POST / PUT | `/creator/onboarding` |
| GET | `/creator/dashboard`, `/creator/earnings` |
| GET | `/creator/listings` | Matched feed + `tracked_url` |
| PATCH | `/creator/listings/{id}` | `is_pinned`, `is_hidden` |
| GET | `/creator/listings/{id}/track-link` |
| PUT | `/creator/payout-method` |

## Admin (`role:admin`)

| Method | Path |
|--------|------|
| CRUD | `/admin/listings`, POST `/admin/listings/ingest` |
| GET | `/admin/fraud-queue`, POST `/admin/fraud-queue/{id}/resolve` |
| GET | `/admin/payouts/preview?mode=all\|auto\|manual` |
| POST | `/admin/payouts/batches` body `{ mode }` |
| POST | `/admin/payouts/batches/{id}/complete` |
| GET | `/admin/programs` |
| POST | `/admin/programs/{id}/activate` |
| POST | `/admin/programs/{id}/pause` |
| POST | `/employer/onboarding` |
| GET | `/employer/me` |
| GET/POST | `/employer/programs` |
| GET | `/employer/programs/{id}` |
| GET | `/employer/programs/{id}/applications` |
| POST | `/employer/programs/{id}/applications/{id}/confirm\|reject` |
| GET | `/creator/campaigns` |
| POST | `/creator/campaigns/{id}/opt-in\|opt-out` |
| POST | `/webhooks/ppa` header `X-Joborio-Webhook-Secret` |

## Frontend client

All wrappers live in `frontend/lib/api/` (`auth`, `creator`, `employer`, `listings`, `admin`, `public`, `index.ts`).

## Not implemented yet

Referral APIs (J), Stripe escrow, idempotency keys, full Module H auto-matching in creator listings feed.
