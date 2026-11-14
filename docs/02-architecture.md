# Architecture

```mermaid
flowchart LR
  subgraph public [Public]
    CP[Creator page SSR]
    Seeker[Job seeker traffic]
  end
  subgraph app [Application]
    Next[Next.js]
    Laravel[Laravel API]
    Worker[Queue workers]
  end
  subgraph data [Data]
    MySQL[(MySQL 8)]
    Redis[(Redis)]
  end
  subgraph ext [External]
    Agg[Job aggregators]
    Stripe[Stripe escrow]
    Wise[Wise PayPal Payoneer]
    AI[Claude GPT mini]
  end
  Seeker --> CP
  CP --> Next
  Next --> Laravel
  Laravel --> MySQL
  Laravel --> Redis
  Worker --> MySQL
  Laravel --> Agg
  Laravel --> Stripe
  Laravel --> Wise
  Worker --> AI
```

## Principles (blueprint)

- **Server-side tracking (D)** — not client-only JS
- **USD single ledger currency**
- **Blind matching** — employers never see creator PII in marketplace
- **Hold before pay** — pending earnings 3–7 days

## Repo

```
backend/   Laravel — tracking, ledger, matching, admin API
frontend/  Next.js — @handle pages, dashboards, employer portal
```

## Hosting (blueprint §6)

VPS → AWS later; Cloudflare CDN/WAF; SES/Resend email.

## Phase 0 API boundaries

- Creator auth + handle (A)
- Public SSR creator page (B)
- Listing ingestion (C)
- Click redirect + event log (D, PPC only)
- Fraud rules (E)
- Dashboard read (F)
- Manual payout export (I)
- Admin (L)
- GeoIP on events (P)
