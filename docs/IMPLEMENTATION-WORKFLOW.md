# JobOrio — Implementation & Workflow Guide

**Blueprint:** `projects.txt` v2.0  
**Stack:** Next.js (`frontend/`) + Laravel API (`backend/`)  
**Last updated:** October 2026

This document describes **what is built**, **how data flows**, and **what remains for production hardening**. Use it with `docs/06-workflows.md` (short flows) and `docs/03-modules.md` (checklist).

---

## 1. System roles & entry points

| Role | Login | Primary UI |
|------|--------|------------|
| **Creator** | `/login` → onboarding `/onboarding` | `/creator/dashboard`, `/p/{handle}` public page |
| **Employer** | `/login` → `/employer/onboarding` | `/employer/dashboard`, programs, PPA applications |
| **Admin** | `admin@joborio.com` (seed) | `/admin/*` ops console (no marketing header) |
| **Visitor** | None | `/jobs`, syndicated jobs, creator public page |

**API base:** `NEXT_PUBLIC_API_URL` → Laravel `APP_URL` (default `http://127.0.0.1:8000`).

---

## 2. End-to-end workflow map

```mermaid
flowchart TB
  subgraph ingest [Module C - Jobs]
    XML[XML / DB feeds]
    AdminList[Admin listings]
    EmpProg[Employer programs]
  end

  subgraph surface [Module B - Surfaces]
    JobsPage[/jobs + public XML API]
    CreatorPage[/p/handle]
  end

  subgraph track [Module D - Tracking]
    RLink["/r/{token} redirect"]
    WebTrack[Website embed script]
    Events[(attribution_events)]
  end

  subgraph money [Modules F I]
    Ledger[(earning_ledgers)]
    Payout[Admin payout batches]
  end

  XML --> JobsPage
  AdminList --> JobsPage
  EmpProg --> CreatorPage
  CreatorPage --> RLink
  JobsPage --> RLink
  RLink --> Events
  WebTrack --> Events
  Events --> Ledger
  Ledger --> Payout
```

---

## 3. Module implementation status (A–P)

| Module | Name | Status | Where in code / UI |
|--------|------|--------|---------------------|
| **A** | Creator onboarding | **Done** | `OnboardingController`, `/onboarding`, OAuth |
| **B** | Public creator page | **Done** | `/p/[handle]`, listings, pin/hide |
| **C** | Jobs & courses | **Done** | Syndication feeds, `vigyapanam` XML stream, admin listings, ingest |
| **D** | Tracking & attribution | **Done** | `/r/{token}`, `ClickTrackingService`, dedup, self-click |
| **E** | Fraud detection | **Partial** | Rules + `fraud_reviews` queue; no paid API |
| **F** | Creator dashboard | **Done** | `/creator/dashboard`, job preferences, preferred jobs, earnings |
| **G** | Employer marketplace | **Done** | `/employer/*`, job preferences, auto-live programs (`JOBORIO_EMPLOYER_PROGRAMS_AUTO_ACTIVATE`) |
| **H** | Auto-matching | **Partial** | `ProgramMatchingService`, creator Campaigns opt-in; no budget reallocation |
| **I** | USD payouts | **Partial** | Batches, Wise/PayPal fields; manual complete; no live rails |
| **J** | Referrals | **Done** | `/creator/referrals`, `ReferralService`, signup `?ref=` |
| **K** | AI Post Studio | **Partial** | Template captions, monthly cap; no OpenAI yet |
| **L** | Admin panel | **Done** | `/admin/*`, users, feeds, fraud, payouts, disputes, website tracking |
| **M** | Trust tiers | **Done** | `TrustTierService`, `/creator/trust-tier`, gates PPR/PPA |
| **N** | Notifications | **Partial** | In-app bell + email (`MAIL_MAILER=log` local); no Telegram |
| **O** | Disputes | **Done** | Employer dispute PPA, admin uphold/reject, earnings reversal |
| **P** | Geo / locale | **Partial** | Country filters, **Google Maps** (job map, admin geo traffic, embed GPS), geocoding on admin listings |


---

## 4. Core workflows (implemented)

### 4.1 PPC — pay per click (Module D + E)

1. Creator gets **tracking token** per listing (`TrackingLinkController`).
2. Visitor hits **`GET /r/{token}`** → `ClickTrackingService::recordClick`.
3. **Dedup:** same token + IP + device fingerprint within `JOBORIO_CLICK_DEDUP_MINUTES` (default 10) → `fraud_status=dedup`, not paid.
4. **Self-click:** creator login IP cached → `self_click` + fraud queue.
5. **Velocity / datacenter:** `FraudDetectionService` may block and queue review.
6. Counted click → **PPC earning** (`EarningLedgerService`), program budget spend if applicable.
7. Hold → approved → payable → **admin payout batch** → paid.

**Visibility:** Admin dashboard & activity; creator dashboard “Duplicate clicks” + recent traffic.

### 4.2 PPR — pay per registration (Phase 1)

1. Destination fires **`POST /api/v1/webhooks/ppr`** with tracking token + email.
2. Row in `ppr_registrations` → pending email verification.
3. User opens **`/ppr/verify?token=...`** → verified → earning if tier allows (`TrustTierService`).
4. Disposable email + hourly caps in `PprRegistrationService`.

### 4.3 PPA — pay per application (Phase 3)

1. **`POST /api/v1/webhooks/ppa`** creates application `pending_employer`.
2. Employer confirms/rejects on **`/employer/programs/{id}/applications`**.
3. Confirm → PPA earning + budget spend (Mid+ tier unless config override).
4. **Dispute:** employer disputes confirmed app → creator notified → admin **Disputes** → uphold reverses ledger.

### 4.4 Employer program (Module G + H)

1. Employer **dashboard** → **New program** → launches **active** immediately (default).
2. Listing created under program; creators see match in **Campaigns** if `creatorEligible()`.
3. Creator **Join campaign** → opt-in pivot → PPC/PPA uses program listing + budget.
4. Employer **program dashboard** (`/employer/programs/{id}`): match preview, pause/resume.

### 4.5 Creator campaigns vs opportunities

| Area | Purpose |
|------|---------|
| **Opportunities** | Marketplace / syndicated listings — copy tracked links |
| **Campaigns** | Employer **programs** (PPC/PPR/PPA) — opt-in required |

Seed demo campaigns: `php artisan db:seed --class=Database\\Seeders\\DemoSeeder` (`employer@joborio.com`).

### 4.6 Referrals (Module J)

1. Referrer link `?ref=` stored on onboarding.
2. Referred creator earns → `ProcessReferralRewardsJob` / `ReferralService` (bonus + override window).

### 4.7 Trust tiers (Module M)

- **Nano:** PPC; manual payout bias.
- **Micro:** + PPR (config may allow nano for dev).
- **Mid:** + PPA, auto-payout eligible.
- Promotion: `TrustTierService::evaluateAndPromote` + in-app/email notification.

### 4.8 Payouts (Module I)

1. Admin **Payouts** → preview batch (auto vs manual by tier).
2. Create batch → complete batch marks ledger **paid** + creator **payout_completed** notification.

### 4.9 Google Maps & location (Module P)

1. **Keys:** **Admin → Platform settings** (`/admin/settings`) stores encrypted keys in DB, or use `.env`: `GOOGLE_MAPS_API_KEY` (Geocoding) + browser key in admin or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Enable **Maps JavaScript API** and **Geocoding API** in Google Cloud.
2. **Listings:** Admin create/update runs geocoding from `location_label` + `country_code`; backfill with `php artisan listings:geocode`.
3. **Public UI:** `/jobs` marketplace **Map** view (`GET /api/v1/listings/map-points`); job detail shows a pin when coordinates exist.
4. **Admin:** `/admin/geo` — click + website traffic map (`GET /api/v1/admin/geo/traffic-map`).
5. **Tracking:** Website embed optionally sends GPS (`pageview_geo`) when visitors allow; PPC clicks accept `geo_lat` / `geo_lng` query params on `/r/{token}`.

### 4.10 Admin website tracking (extension)

1. **Admin → Website tracking** — register domain, copy `<script>` snippet.
2. External site loads `GET /api/v1/track/script/{key}.js` → beacons `POST /api/v1/track/hit/{key}`.
3. Pageviews in `website_tracking_events` (separate from creator `/r/` PPC).

### 4.11 Leaderboard (Phase 4 preview)

- **`GET /api/v1/public/leaderboard`** — top creators by 30d verified clicks.
- UI: **`/leaderboard`**.

---

## 5. Admin operations workflow

| Task | Path |
|------|------|
| XML syndication | `/admin/syndication-feeds` |
| Jobs catalog | `/admin/jobs`, public XML via `frontend/public` + stream API |
| Users & activity | `/admin/users`, `/admin/activity` (filter **Duplicates only**) |
| Fraud | `/admin/fraud` |
| Disputes | `/admin/disputes` |
| Payouts | `/admin/payouts` |
| External site analytics | `/admin/website-tracking` |
| Geo traffic map | `/admin/geo` |
| API keys & integrations | `/admin/settings` |

---

## 6. Configuration reference

| Variable | Purpose |
|----------|---------|
| `JOBORIO_CLICK_DEDUP_MINUTES` | PPC duplicate window (default 10) |
| `JOBORIO_EMPLOYER_PROGRAMS_AUTO_ACTIVATE` | Employer programs live without admin (default true) |
| `JOBORIO_REFERRAL_*` | Bonus, override %, months |
| `JOBORIO_AI_STUDIO_MONTHLY_CAP` | AI generations per creator (default 5) |
| `JOBORIO_PPR_WEBHOOK_SECRET` / `JOBORIO_PPA_WEBHOOK_SECRET` | Webhook auth headers |
| `FRONTEND_URL` / `APP_URL` | OAuth, emails, embed script URLs |
| `JOBORIO_WEBTRACK_DEDUP_MINUTES` | Website embed pageview dedup |
| `GOOGLE_MAPS_API_KEY` | Server-side Geocoding (listings) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Frontend Maps JS (set in `frontend/.env*`) |
| `JOBORIO_GOOGLE_MAPS_ENABLED` | Toggle maps features (default true) |
| `JOBORIO_GEOLOCATION_TRACKING` | Website embed asks browser GPS (default true) |

---

## 7. Testing & UAT

| Command | Purpose |
|---------|---------|
| `php artisan test` | **26 tests** — SQLite `:memory:` (no MySQL required for CI) |
| `php artisan listings:geocode` | Backfill listing lat/lng via Google Geocoding |
| `npm run build` | Frontend production build |
| `scripts/run-full-validation.ps1` | Tests + build (+ optional live smoke) |
| `scripts/uat-smoke.ps1` | API + admin login (needs `php artisan serve` + MySQL for app DB) |
| `scripts/frontend-smoke.ps1` | Route HTTP smoke (needs `npm run start`) |

**Process coverage in PHPUnit:** PPC + dedup, PPR webhooks, PPA + employer confirm + dispute, programs, trust tier, payouts, referrals path, notifications, website embed tracking, leaderboard, social auth, listings.

**Local app database:** MySQL `joborio` for dev (`php artisan migrate --seed`). Tests do **not** use MySQL.

See **`docs/UAT.md`**.

---

## 8. Production gaps (honest)

1. **Payments:** Stripe employer prefund; live Wise/PayPal/Payoneer APIs.
2. **KYC / tax:** W-8BEN / W-9 collection before first payout.
3. **Email:** SES/Resend production; Telegram bot (Module N).
4. **Fraud:** IP2Location datacenter list; optional paid fraud API.
5. **AI Studio:** OpenAI/Claude with language detection.
6. **Module H:** Budget auto-reallocation across creators.
7. **i18n / GDPR:** Translated UI, cookie consent banners.
8. **Scale:** Queue workers for ingest, referral job, scheduled payouts.

---

## 9. Repository map

```
upsidcnew/
├── projects.txt          # Blueprint source of truth
├── docs/                 # This guide + architecture
├── frontend/             # Next.js App Router
├── backend/              # Laravel API + migrations
└── scripts/              # Smoke tests
```

**Default demo accounts (after `DemoSeeder`):**

- Admin: `admin@joborio.com` / `password`
- Employer: `employer@joborio.com` / `password`

---

## 10. Quick role journeys

**Creator:** Sign up → onboarding → **Job preferences** → Opportunities (links) → Campaigns (opt-in) → share `/p/{handle}` or `/r/{token}` → Dashboard (preferred jobs) → Trust tier → Referrals → AI Studio (cap).

**Employer:** Onboarding → Dashboard (preferred market jobs) → **Job preferences** → Create program → View match stats → Pause/resume → PPA applications / disputes.

**Admin:** Dashboard overview → Feeds & listings → Fraud & disputes → Payout batches → Website tracking embed for owned properties.

**Visitor:** `/jobs` or creator page → click → redirect to employer destination; PPC attributed server-side.
