# Requirements source

**Authoritative spec:** [`../projects.txt`](../projects.txt) — *PROJECT BLUEPRINT v2.0* (September 2026, Confidential).

Product: **Creator Performance Marketplace** — career & education, all industries, global, **USD payouts** (PPC / PPR / PPA).

Public creator URLs: `brand.link/@handle` (per blueprint).

## Module letters (A–P)

| Module | Name |
|--------|------|
| A | Creator Signup & Onboarding |
| B | Public Creator Page & My Link |
| C | Job & Course Management |
| D | Tracking & Attribution Engine |
| E | Bot & Fake Traffic Detection |
| F | Creator Dashboard & Earnings (USD) |
| G | Program Marketplace (Employer/Institute Portal) |
| H | Auto-Matching Engine |
| I | USD Payout System (Global) |
| J | Referral & Creator Growth Engine |
| K | AI Post Studio (Capped) — Phase 2 |
| L | Admin Panel |
| M | Trust-Tier System |
| N | Notifications & Communication |
| O | Dispute & Attribution Resolution |
| P | Multi-Country & Localization |

## Stack (from blueprint §6)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js |
| Backend | Laravel (PHP 8+) |
| Database | **MySQL 8** (local: XAMPP) + Redis |
| Cache / queue | Redis |

Aligned with blueprint §6 (`docker-compose.yml`, `backend/.env.example`).

## Phased build (blueprint §7)

- **Phase 0 (MVP):** A, B, C, D (PPC), E, F, I (manual payout), L, P (GeoIP basics)
- **Phase 1:** PPR + auto-payout batch
- **Phase 2:** J, K, M, N
- **Phase 3:** Courses, G, H, PPA, O
- **Phase 4:** Leaderboard, multi-language, analytics, custom domains, mobile app

All other docs in this folder are derived from `projects.txt`.
