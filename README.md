# JobOrio — Creator Performance Marketplace

Global performance marketplace: creators promote jobs & courses, earn **USD** on verified **clicks (PPC)**, **registrations (PPR)**, and **applications (PPA)**. Employers/institutes launch campaigns without contacting creators directly.

**Source of truth:** [`projects.txt`](./projects.txt) (Blueprint v2.0, Sept 2026).

| Layer | Technology (per blueprint) |
|-------|----------------------------|
| Frontend | Next.js |
| Backend | Laravel |
| Database | MySQL 8 + Redis |
| Payouts | Wise / PayPal / Payoneer |
| Employer billing | Stripe (USD escrow) |

## Documentation

Start at [docs/README.md](./docs/README.md).

## Repo layout (target)

```
├── backend/           # Laravel 12 API (Phase 0)
├── frontend/          # Next.js UI (designs + API wiring)
├── docker-compose.yml # MySQL 8 + Redis (optional)
├── docs/
└── projects.txt
```

## Next steps

1. Confirm product domain (`joborio.com` vs `brand.link`) for public URLs.
2. Scaffold Laravel + Next.js when ready.
3. **Backend Phase 0** is in `backend/` — see [backend/README.md](./backend/README.md).
