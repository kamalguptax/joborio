# JobOrio — Testing & UAT Report

**Date:** 2026-10-15  
**Environment:** Local (`API` `http://127.0.0.1:8000`, `Frontend` `http://localhost:3000`)

## Automated test results

| Suite | Result | Notes |
|--------|--------|--------|
| **PHPUnit** (`php artisan test`) | **23 passed** (114 assertions) | SQLite `:memory:` in `phpunit.xml` |
| **Next.js build** (`npm run build`) | **Pass** | 43 routes compiled |
| **ESLint** (`npm run lint`) | **Fail** | Warnings/errors in app + vendored assets; not blocking build |
| **UAT smoke** (`scripts/uat-smoke.ps1`) | **11/11 pass** | API + public pages + admin auth |
| **Frontend smoke** (`scripts/frontend-smoke.ps1` or `npm run test:smoke`) | **21/21 pass** | All major routes HTTP 200 |
| **ESLint** (`npm run lint` on `app components lib`) | **7 errors, 10 warnings** | Does not block `npm run build` |

### PHPUnit coverage (modules)

| Test file | Scenarios |
|-----------|-----------|
| `PpcClickTest` | Tracked redirect, click logging |
| `PprRegistrationTest` | Webhook, verify, dedup, bad secret |
| `ModuleGProgramsTest` | Employer program, PPC spend, PPA confirm |
| `TrustTierAndPayoutTest` | Tier promotion, auto payout batch, batch complete |
| `CreatorListingTest` | Creator listings pin/hide |
| `ModuleCListingsTest` | Public listings, ingest, admin CRUD |
| `SocialAuthTest` | OAuth providers + callback |
| `DisputesAndNotificationsTest` | Employer dispute → creator notify → admin resolve; notifications API |

### Fixes applied during test run

- `CreatorListingTest`: refresh user after onboarding so `creator` relation exists.
- `ModuleGProgramsTest` (PPA): refresh employer + `assertCreated` on program create.

---

## UAT smoke script

```powershell
# Start API + frontend first, then:
powershell -ExecutionPolicy Bypass -File scripts/uat-smoke.ps1
```

Optional: `-ApiBase`, `-FrontendBase`, `-AdminEmail`, `-AdminPassword`.

---

## Manual UAT checklist (sign-off)

Use seeded admin: `admin@joborio.com` / `password` (after `php artisan migrate --seed` on **joborio** DB).

### Public / job seeker

| # | Step | Expected | Status |
|---|------|----------|--------|
| P1 | Open `/` | Home loads, opportunity section | Smoke ✓ |
| P2 | Open `/jobs` | Job list (API + public XML) | Smoke ✓ |
| P3 | Open syndicated job `/jobs/s/{ref}` | Detail + apply CTA | Manual |
| P4 | Apply without login | Redirect to login with `?next=` | Manual |
| P5 | After login, apply | External or gated apply works | Manual |

### Creator

| # | Step | Expected | Status |
|---|------|----------|--------|
| C1 | Signup + `/onboarding` | Handle claimed, public URL | Manual |
| C2 | `/creator/dashboard` | Stats load | Manual |
| C3 | `/creator/opportunities` + campaigns opt-in | Program visible after admin activates | API ✓ (programs test) |
| C4 | Share track link `/r/{token}` | Redirect + PPC event | API ✓ |
| C5 | `/creator/earnings` | Ledger rows | Manual |
| C6 | `/creator/referrals` | Dashboard | Manual |
| C7 | `/creator/ai-studio` | Generate within monthly cap | Manual |
| C8 | `/creator/trust-tier` | Tier + progress | Manual |
| C9 | Notification bell | Unread count + mark read | API ✓ (notifications test) |

### Employer

| # | Step | Expected | Status |
|---|------|----------|--------|
| E1 | Employer onboarding | Company profile | API ✓ |
| E2 | Create program (PPC/PPR/PPA) | `pending_review` | API ✓ |
| E3 | Admin activates program | Status `active` | API ✓ |
| E4 | PPA webhook + confirm application | Earning `ppa` | API ✓ |
| E5 | Dispute confirmed application | Dispute open, creator notified | API ✓ |

### Admin

| # | Step | Expected | Status |
|---|------|----------|--------|
| A1 | `/admin/dashboard` | Overview metrics | Smoke ✓ + browser login ✓ |
| A2 | `/admin/syndication-feeds` | CRUD feeds | Smoke ✓ (API) |
| A3 | `/admin/fraud` | Fraud queue | Smoke ✓ (API) |
| A4 | `/admin/disputes` | Uphold / reject | API ✓ |
| A5 | `/admin/payouts` | Preview + complete batch | API ✓ |
| A6 | `/admin/users` | User list (table renders) | Build ✓ |

### Notifications (Module N)

| # | Step | Expected | Status |
|---|------|----------|--------|
| N1 | In-app on tier upgrade / fraud / dispute / payout | Row in `user_notifications` | Partial API ✓ |
| N2 | Email mirror | `MAIL_MAILER=log` → `storage/logs/laravel.log` | Manual |

---

## Known gaps / not UAT’d

- Real SMTP, Wise/PayPal payouts, OpenAI AI studio, Telegram bot, multi-language UI.
- Full browser E2E (Playwright) not in repo; smoke script covers HTTP only.
- ESLint: clean up `react-hooks` rules on admin pages; exclude vendored XML tooling paths if needed.
- Large public XML (`vigyapanam_en_IN.xml`): performance test on low-memory hosts not automated.

---

## How to re-run full regression

```powershell
# Full validation (recommended)
powershell -ExecutionPolicy Bypass -File scripts/run-full-validation.ps1

# Backend only (SQLite — no MySQL needed for tests)
cd backend
php artisan test

# Frontend
cd frontend
npm run build
npm run lint   # optional quality gate

# Live smoke (servers running)
powershell -ExecutionPolicy Bypass -File ../scripts/uat-smoke.ps1
```
