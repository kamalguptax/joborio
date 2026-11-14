# Database Design (MySQL 8)

ACID ledger per blueprint §6. Implement via Laravel migrations.

## Core entities

```
creators
  user_id, handle (unique), niche_ids[], audience_countries[], trust_tier,
  onboarding_completed_at, referral_code, referred_by_creator_id

creator_pages
  creator_id, bio, accent_color, social_links JSON, pinned_listing_ids[]

listings
  type (job|course), external_id, title, company, location, remote_flag,
  category, experience, salary_range, status, source (aggregator|employer)

programs
  employer_id, title, pricing_model (ppc|ppr|ppa), rate_usd, budget_usd,
  budget_remaining, audience_criteria JSON, status, stripe_escrow_ref

program_listings
  program_id, listing_id

tracking_tokens
  creator_id, listing_id, program_id nullable, token (unique)

attribution_events
  token_id, event_type, ip, device_fingerprint, geo_country, referrer,
  counted (bool), fraud_flag, raw JSON, created_at

earnings_ledger
  creator_id, event_id nullable, amount_usd, type (ppc|ppr|ppa|referral),
  state (pending|approved|payable|paid|reversed), hold_until, program_id

payout_batches
  status, total_usd, approved_by, processed_at

payout_lines
  batch_id, creator_id, amount_usd, method (wise|paypal|payoneer), status, external_ref

employers
  user_id, company_name, website, verified_at

disputes
  event_id, employer_id, reason, status, admin_ruling

referrals
  referrer_id, referred_id, bonus_paid, override_ends_at
```

## Indexes

- `attribution_events(token_id, created_at)`
- `attribution_events(device_fingerprint, created_at)` for dedup
- `earnings_ledger(creator_id, state)`
- `creators(handle)` unique

## State machine — earnings

`pending` → `approved` → `payable` → `paid` (or `reversed` from fraud/dispute)

## Redis

- Rate limits, dedup windows, session, queue jobs

## Not in Phase 0 schema

- Full `courses` extensions, `programs` self-serve (Phase 3), AI usage counters (Phase 2)
