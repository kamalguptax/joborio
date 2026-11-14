# JobOrio Publisher Network — Cursor AI Development Document

**Purpose:** Developer handoff and working instruction set for implementing the JobOrio publisher/community network features described in the supplied requirements.

**How to use this document**
1. Open the existing JobOrio codebase in Cursor.
2. Add this document to the repository (for example, `docs/JOBORIO_CURSOR_DEVELOPMENT.md`).
3. Paste the **Master Cursor AI Prompt** near the end into Cursor Agent/Composer.
4. Ask Cursor to inspect the repository and propose a plan before making changes.
5. Implement and test in small, reviewable phases. Do not ask Cursor to rebuild the whole application in one pass.

---

## 1. Product overview

JobOrio needs a publisher-managed network model. A publisher can register, be reviewed and activated, create private communities, invite creators/members, assign campaigns, and monitor member activity and publisher-level commercial performance.

A network member receives a private member account and a limited dashboard. Members can see activity and performance counts, but must not see CPC prices, partner payouts, publisher commissions, JobOrio platform fees, financial balances, or withdrawal functions.

The system must distinguish the publisher's commercial/financial view from the member's activity-only view. This distinction must be enforced in backend authorization and API responses, not only by hiding interface elements.

### Main user types

- **Publisher:** Owns a publisher account, manages communities and members, assigSns campaigns, and views publisher-level commercial and financial information.
- **Publisher owner/manager:** A user who operates a publisher account. Managers must be limited to the communities they manage.
- **Network member:** A private member account associated with a publisher/community. Sees only their own permitted activity information.
- **JobOrio administrator/reviewer:** Reviews publisher applications and controls approval/activation. The supplied requirements imply this operational role but do not define a complete admin screen.
- **Partner/integration system:** Supplies confirmed campaign events/actions and may communicate through API, XML, webhooks or tracking redirects.

Do not assume that these roles already exist in the codebase. Inspect the current authorization model first and map these requirements onto it.

---

## 2. Core functional requirements

### 2.1 Login and account security

Support:
- Email/username and password login.
- Email/OTP verification.
- Forgot-password flow.
- Optional two-factor authentication for publishers.
- Session expiry and secure logout.
- Login history and suspicious-login alerts.
- Role-based access checks.
- Invitation-token validation for new members.

Security requirements:
- Validate authorization on the server for every protected page, API route and data query.
- Do not rely on frontend route guards as the only access control.
- Store passwords using the project's established secure password-hashing approach; never store plaintext passwords.
- Store invitation tokens securely, enforce expiry and single-use/appropriate-use rules, and avoid exposing raw tokens in logs.
- Rate-limit sensitive authentication and invitation endpoints where the existing stack supports it.
- Do not log passwords, OTPs, access tokens, API secrets or other credentials.

### 2.2 Publisher registration

**Page:** `joborio.com/publisher/register`

Keep the registration as a single-page form. Do not add a second profile-building wizard after registration.

| Field | Requirement |
|---|---|
| Full name | Mandatory |
| Username | Mandatory and unique |
| Email | Mandatory |
| Country | India, UAE, USA |
| Audience niches | Multiple selection |
| Job preferences | Full-time, Part-time, Remote, Internship |
| Network type | Agency, Publisher, Affiliate, Community |
| Social media URL | Mandatory |
| Website/community URL | Mandatory |
| Integration preference | Dashboard, API, XML, Webhook |

After submission, track these application stages:
1. Application submitted.
2. Email verified.
3. Social profile and network reviewed.
4. Commercial terms and commission approved.
5. Publisher account activated.
6. Publisher receives login credentials and a welcome email.

Implement status transitions explicitly. Do not activate a publisher merely because the registration form was submitted. The requirements do not specify the reviewer interface, exact status names in the database, email provider, or approval SLA; inspect existing project functionality and flag decisions that need product-owner confirmation.

### 2.3 Publisher dashboard

Required dashboard navigation:
- Overview
- My Network
- Communities — preserve the existing Communities experience; do not change it unnecessarily.
- Campaign Marketplace
- Performance Reports
- Publisher Earnings — do not expose creator/member earnings here as if they were publisher earnings.
- API & Integration — preserve existing functionality; do not change it unnecessarily.
- Payment History
- Account Settings

Build on existing screens and components where possible. Avoid replacing working modules just to make the code look different.

### 2.4 Community management

A publisher can create multiple communities.

**Create Community fields:**

| Field | Requirement/example |
|---|---|
| Community name | Example: IT & Career Creators |
| Community ID | Auto-generated |
| Category | Example: Education / Technology |
| Description | Example: Creators promoting IT jobs and courses |
| Country | Example: India |
| Members | Invite or upload |
| Campaign access | All eligible / selected campaigns |
| Manager | Assign a network manager |
| Status | Active / Paused |

The UI and backend must support community status and manager assignment. A manager may access only the communities assigned to them.

### 2.5 Add and invite members

Provide four methods:
1. Individual invitation link.
2. Email invitation.
3. CSV bulk upload.
4. API member creation.

Example invitation URL format from the requirements:
`joborio.com/join/PUB001/COM001`

Treat this as an illustrative route format, not a fixed production identifier scheme. Use secure, unguessable invitation tokens and validate publisher/community association, expiry, status and intended use.

Each creator who joins through a valid publisher invitation becomes a **private Network Member account** associated with the publisher/community. Do not create a public Creator account as a side effect.

CSV import must validate rows, detect duplicates and invalid invitations, and report row-level errors. Bulk operations should be safe to retry and should not create duplicate memberships.

### 2.6 Network Member Portal

**Dashboard route:** `/network/dashboard`

The member dashboard is activity-focused. It may show:
- Member name and status.
- Publisher and community name.
- Total clicks.
- Valid clicks.
- Signups.
- Applications.
- Leads.
- Conversions.
- Approved/pending action counts.
- Assigned campaign names and campaign status.

Illustrative dashboard content in the requirements:
- Welcome, Rahul
- Active Member
- Publisher: VIG Network · Community: IT & Career
- Example activity: 1,250 clicks, 85 signups, 32 applications, 70 approved actions
- Assigned campaigns such as IT Jobs Campaign, WhatJobs, Machine Learning Course and Education

These names and figures are examples, not seed data or guaranteed production values.

**Member visibility rules:**

| Information | Member can see? |
|---|---:|
| Total clicks | Yes |
| Valid clicks | Yes |
| Signups | Yes |
| Applications | Yes |
| Leads | Yes |
| Conversions | Yes |
| Approved/pending action counts | Yes |
| Campaign status | Yes |
| Publisher name | Yes |
| CPC price | No |
| Partner payout | No |
| Publisher commission | No |
| JobOrio platform fee | No |
| Member financial balance | No |
| Withdrawal | No |

The member must see only their own activity records and assigned campaigns. Never return financial fields to member-facing APIs, even if the frontend does not render them.

### 2.7 Campaign assignment and performance

- Publishers can assign eligible campaigns to communities/members according to campaign access settings.
- Members see only campaigns assigned to them and permitted activity/status fields.
- Publisher users can see campaign prices and network financial reports according to their permissions.
- Campaign commission rates must be versioned/locked when an assignment is accepted. A later rate change must not silently alter the economics of an existing accepted assignment.
- Only partner-confirmed actions can contribute to approved campaign revenue.
- Tracking identifiers must remain intact through partner redirects.
- Rejected or reversed actions must be reflected through ledger adjustments, not by silently overwriting historical financial entries.

The exact partner event schema, attribution window, deduplication rules and campaign eligibility rules are not specified in the supplied requirements. Inspect existing integrations and document any gaps before implementing.

---

## 3. Data model and backend entities

The requirements call for these separate entities:

| Entity | Purpose |
|---|---|
| `publishers` | Publisher account |
| `publisher_users` | Publisher owners and managers |
| `communities` | Private publisher communities |
| `network_members` | Private creator/member accounts |
| `community_members` | Community-to-member relationship |
| `publisher_invitations` | Invitation links, tokens and expiry |
| `publisher_campaigns` | Campaign assignments |
| `publisher_commissions` | Publisher's commercial rate |
| `member_activity` | Clicks, signups, applications and conversions |
| `publisher_ledger` | Financial settlement record |
| `member_settlement_records` | Publisher-managed member payment reconciliation |
| `api_credentials` | Private publisher integration credentials |
| `webhook_events` | Partner and publisher event notifications |
| `audit_logs` | Changes, login and financial activity |

### Data-model implementation guidance

- Review the existing database and naming conventions before creating migrations.
- Reuse existing user identity tables where appropriate; do not create a second JobOrio identity for the same person.
- Add foreign keys, unique constraints, indexes and deletion/retention behavior appropriate to the existing database.
- Represent publisher/community membership explicitly rather than inferring it from a display name or URL.
- Preserve historical activity when a member is removed. Prefer status/end-date changes or soft deletion where suitable; do not cascade-delete historical performance.
- Store the commission/rate version or immutable snapshot on the campaign assignment so historical assignments retain their accepted terms.
- Use immutable ledger entries for financial movements. Corrections should be new reversal/adjustment entries linked to the original entry.
- Keep publisher financial settlement and member payment reconciliation separate.
- Store API credentials as hashes or encrypted secrets using the project's security pattern. Never return secrets in ordinary API responses.
- Make webhook processing idempotent. Persist event identifiers/status and prevent duplicate processing.
- Add audit events for security-sensitive, membership, campaign-rate and financial changes.

The requirements identify entity names and purposes, but do not provide a complete column-level schema. Cursor must propose a schema after inspecting the existing database and must explain migration impact before applying it.

---

## 4. Non-negotiable business and technical rules

1. One active parent publisher per member in the initial version.
2. One person has one JobOrio identity, not duplicate Creator and Member accounts.
3. Members cannot self-promote to public Creators while their network membership is active.
4. Removing a member must not delete historical performance.
5. Commission rates are locked to the campaign-assignment version.
6. Financial records are immutable ledger entries with reversal adjustments, not overwritten totals.
7. Only partner-confirmed actions can produce approved campaign revenue.
8. Publisher financial APIs are inaccessible to members.
9. Existing independent creators can join a publisher only through explicit account conversion or a linked membership agreement.
10. When a member leaves, settle pending activity and formally release the membership before independent Creator registration is enabled.

These rules must be enforced in backend services, database constraints/transactions where appropriate, and automated tests.

### Account lifecycle

At minimum, model and test:
- Invitation created → accepted/expired/revoked.
- Member active in publisher network.
- Member removed or leaves.
- Pending activity settlement.
- Membership formally released.
- Independent Creator registration becomes eligible only after release.
- Existing independent Creator joining a publisher requires an explicit conversion or linked membership agreement.

Do not assume that “remove member,” “leave m,” and “release membership” are identical operations. Keep their effects explicit and auditable.

---

## 5. Security, privacy and authorization matrix

Implement authorization by role, resource ownership and relationship.

| Capability/data | Publisher owner | Assigned manager | Network member |
|---|---:|---:|---:|
| Manage publisher account | Yes | Only if permitted | No |
| View all publisher communities | Yes | No, only assigned communities | No |
| Manage assigned communities | Yes | Yes, within assignment | No |
| Invite/manage members | Yes | Within assigned communities | No |
| View own activity | If relevant | Within managed scope | Yes |
| View other members' activity | According to publisher permissions | Within managed scope | No |
| View campaign commercial rates | Yes, if authorized | Only if explicitly authorized | No |
| View publisher financial reports | Yes, if authorized | Only if explicitly authorized | No |
| Access publisher financial APIs | Yes, if authorized | Only if explicitly authorized | No |
| View member payment reconciliation | Publisher-managed permission | Only if explicitly authorized | No |
| Manage API credentials | Authorized publisher users | Only if explicitly authorized | No |

This matrix is a starting interpretation of the requirements. Confirm the exact manager permissions with the product owner. Default to deny when permission is not explicitly granted.

**Critical test:** Attempt to retrieve restricted fields through direct API calls, altered IDs, query parameters, browser network responses and guessed endpoints. A hidden UI element is not sufficient protection.

---

## 6. Suggested implementation phases

Cursor should first inspect the repository and adapt this order to the existing architecture.

### Phase 0 — Repository discovery and plan
- Identify framework, language, package manager, app structure and current run/test commands.
- Identify authentication, user roles, database/ORM, migrations, API conventions and existing Creator/Publisher/Community modules.
- Locate the existing Communities and API & Integration features and mark them as protected from unnecessary changes.
- Identify existing campaign tracking and partner integrations.
- Report gaps, risks and files likely to change.
- Produce a phased implementation plan. Do not edit files in this phase unless explicitly asked.

### Phase 1 — Domain model and migrations
- Design publisher, publisher-user, network-member, community membership, invitation, campaign assignment, activity, ledger, settlement, credentials, webhook and audit structures.
- Map to existing user identity rather than duplicating users.
- Add constraints, indexes and safe migrations.
- Explain rollback and existing-data impact.

### Phase 2 — Authentication and publisher onboarding
- Implement publisher registration as one page.
- Add verification and application status workflow.
- Implement approval/activation using the existing admin/review architecture or clearly identify the missing admin requirement.
- Add publisher login, session handling and optional 2FA if supported by the current stack.

### Phase 3 — Publisher community and member management
- Create/manage multiple communities.
- Assign managers.
- Add individual, email, CSV and API invitation flows.
- Validate tokens and invitation lifecycle.
- Ensure invitees become private Network Members.

### Phase 4 — Member portal and permissions
- Build `/network/dashboard`.
- Display permitted activity and campaign status only.
- Enforce member ownership and financial-data restrictions on the server.
- Prevent duplicate Creator profiles and enforce membership release lifecycle.

### Phase 5 — Campaigns, tracking and reporting
- Implement campaign assignments and immutable accepted rate versions.
- Preserve tracking IDs through redirects.
- Process partner-confirmed events idempotently.
- Separate publisher reporting from member activity reporting.

### Phase 6 — Financial records and integrations
- Implement immutable publisher ledger entries and reversal adjustments.
- Keep member settlement reconciliation separate.
- Secure API credentials and webhook processing.
- Verify that member endpoints cannot access publisher financial APIs.

### Phase 7 — QA, security and release
- Run migrations and automated tests in a safe environment.
- Test role/tenant boundaries and all negative access cases.
- Test CSV duplicates, invalid invitations, expired tokens and retries.
- Verify existing Communities and API & Integration functionality remains intact.
- Document deployment variables, background jobs, webhook setup and operational monitoring.

---

## 7. Required acceptance tests

Do not mark the work complete until these cases pass:

- [ ] Publisher can register through one form.
- [ ] Publisher can log in and reach the correct dashboard.
- [ ] Publisher can create multiple communities.
- [ ] Publisher can invite 10, 50 or 500 members.
- [ ] CSV import rejects duplicates and invalid invitations with useful row-level feedback.
- [ ] An invited person becomes a private Network Member, not a public Creator.
- [ ] An active network member cannot create a second independent Creator profile.
- [ ] Members only see their own clicks, signups and conversion counts.
- [ ] Members cannot access campaign rates through the UI, API or browser network responses.
- [ ] Publisher can see campaign prices and network financial reports when authorized.
- [ ] Publisher can select only permitted commission percentages.
- [ ] JobOrio's platform fee is never distributed to the publisher.
- [ ] Campaign rates remain unchanged for already accepted campaign assignments.
- [ ] Tracking IDs remain intact through partner redirects.
- [ ] Rejected and reversed actions are removed from approved financial totals through ledger adjustments.
- [ ] Publisher settlement and member payment records remain separate.
- [ ] Publisher managers only see data for communities they manage.
- [ ] Leaving a publisher network preserves historical records and releases the account correctly.

Also add tests for unauthenticated access, cross-publisher ID manipulation, expired/reused invitation tokens, duplicate webhook events, unauthorized manager access, session expiry and financial API denial for members.

---

## 8. Development standards for Cursor

- Follow the conventions and architecture already used in the repository. Do not introduce a new framework or major dependency without explaining why and obtaining approval.
- Do not replace working modules or redesign unrelated screens.
- Before editing, list the files/modules expected to change and the reason for each.
- Work in small phases. After each phase, summarize changes, migrations, tests run and remaining issues.
- Write or update tests with each feature; do not postpone all testing until the end.
- Use typed validation at API boundaries where the project supports it.
- Validate and sanitize user input on the server.
- Use transactions for operations that must be atomic, such as accepting invitations, changing membership state, assigning a rate version or posting ledger adjustments.
- Use pagination for potentially large member/activity/report lists.
- Handle loading, empty, error and success states in the UI.
- Do not put secrets in source code, client bundles, logs or committed environment files.
- Do not fabricate partner API behavior. Inspect existing integrations and identify missing partner specifications.
- If a requirement conflicts with existing behavior, stop and explain the conflict rather than silently changing either side.
- If an important detail is unspecified, record the question and choose a conservative implementation only after clearly stating the assumption.

---

## 9. Open questions to confirm before production

The supplied requirements do not fully define the following. Cursor should identify them during repository discovery and request a decision when implementation depends on them:

1. Exact publisher application statuses and who can approve each transition.
2. Admin/reviewer screen and permissions.
3. Exact publisher-manager permission set.
4. Whether a member can belong to multiple communities under the same publisher, or only one community.
5. Email/OTP provider, templates and delivery behavior.
6. 2FA method and recovery process.
7. CSV template, maximum file size and row limits.
8. Invitation expiry, resend, revocation and reuse policy.
9. Partner event schema, signature verification, attribution and deduplication rules.
10. Exact commission calculation, rounding, currency and permitted rate options.
11. Settlement timing, payout provider and tax/compliance requirements.
12. Data retention and privacy/deletion policy.
13. Existing independent Creator conversion and linked-membership consent UX.
14. Whether any existing Creator, Community or API & Integration screens have additional behavior not represented in this requirements extract.

Do not invent answers to these questions.

---

# 10. Master Cursor AI Prompt

Copy the prompt below into Cursor Agent/Composer after opening the JobOrio repository.

```text
You are the senior software engineer responsible for implementing the JobOrio Publisher Network requirements.

SOURCE OF TRUTH
Read the complete document `JOBORIO_CURSOR_DEVELOPMENT.md` (or the supplied requirements document if this file has not yet been added). Treat its functional requirements, visibility rules, business rules and acceptance checklist as the product specification.

PRIMARY GOAL
Implement the publisher-managed network functionality in the existing JobOrio application. Publishers must be able to register, be reviewed/activated, create communities, invite/manage members, assign campaigns and view publisher-level performance/financial information. Invited creators must receive private Network Member accounts with activity-only dashboards. Members must never access publisher commercial or financial data.

IMPORTANT WORKING RULES
1. First inspect the entire repository. Do not start coding immediately.
2. Identify the existing frontend/backend frameworks, database, ORM, authentication, roles, API conventions, tests, deployment setup and current Creator/Publisher/Community/Campaign features.
3. Preserve existing working features. In particular, do not unnecessarily change the existing Communities module or API & Integration module.
4. Reuse the existing JobOrio identity for a person. Do not create duplicate Creator and Member identities.
5. Do not assume a technology stack. Follow the actual repository.
6. Do not introduce major dependencies or rewrite architecture without explaining the need and asking for approval.
7. Do not invent partner API contracts, commission rules, payment-provider behavior or unspecified business decisions.
8. Enforce permissions in backend services, queries and API responses. Hiding a frontend field is not security.
9. Never expose CPC price, partner payout, publisher commission, JobOrio platform fee, member financial balance or withdrawal features to Network Members.
10. Preserve historical activity when a member leaves or is removed.
11. Lock the commission/rate version to each accepted campaign assignment.
12. Use immutable financial ledger entries and reversal/adjustment entries. Do not overwrite financial history.
13. Only partner-confirmed actions can produce approved campaign revenue.
14. Keep publisher financial settlement and member payment reconciliation separate.
15. Make webhook processing idempotent and preserve tracking IDs through partner redirects.
16. Use secure authentication, authorization, validation, audit logging and secret management consistent with the existing project.

PHASE 1 — DISCOVERY ONLY
Before changing files:
- Map the current application architecture.
- Locate the existing user identity and role model.
- Locate current publisher, creator, community, campaign, tracking, reporting and integration functionality.
- Identify reusable pages, components, services, tables and API endpoints.
- Identify conflicts between the requirements and existing behavior.
- Identify missing specifications and decisions that require product-owner input.
- Propose a phased plan with the files/modules likely to change.
- Report security and migration risks.
Do not make code changes during this phase. Wait for approval of the plan.

PHASE 2 — DOMAIN MODEL
After approval, design the data model using the required concepts:
publishers, publisher_users, communities, network_members, community_members, publisher_invitations, publisher_campaigns, publisher_commissions, member_activity, publisher_ledger, member_settlement_records, api_credentials, webhook_events and audit_logs.

Adapt names and relationships to existing conventions. Reuse the existing user table where appropriate. Provide migrations, foreign keys, indexes, uniqueness constraints and safe rollback strategy. Do not assume the requirements provide every column; explain the proposed schema and assumptions before applying migrations.

Enforce these rules:
- One active parent publisher per member in the initial version.
- One JobOrio identity per person.
- No independent Creator promotion while active network membership exists.
- Historical performance survives member removal.
- Accepted campaign assignments retain their original rate version.
- Ledger history is immutable; corrections are reversal/adjustment entries.
- Member financial APIs are inaccessible to members.
- Existing independent Creators join only through explicit conversion or linked membership agreement.
- A leaving member must complete pending settlement and formal membership release before independent Creator registration is enabled.

PHASE 3 — PUBLISHER ONBOARDING
Implement the one-page registration form at `/publisher/register` with:
full name, unique username, email, country (India/UAE/USA), multi-select audience niches, job preferences (Full-time/Part-time/Remote/Internship), network type (Agency/Publisher/Affiliate/Community), mandatory social media URL, mandatory website/community URL, and integration preference (Dashboard/API/XML/Webhook).

Implement the application workflow:
application submitted → email verified → social profile/network reviewed → commercial terms/commission approved → publisher activated → credentials and welcome email sent.

Do not add another profile-building wizard after registration. Reuse the existing admin/review process if available. If no review process exists, report what must be added and ask for approval before inventing the admin workflow.

PHASE 4 — PUBLISHER DASHBOARD AND COMMUNITIES
Implement or adapt the publisher navigation:
Overview, My Network, Communities, Campaign Marketplace, Performance Reports, Publisher Earnings, API & Integration, Payment History, Account Settings.

Preserve existing Communities and API & Integration behavior unless a required change is explicitly identified.

Allow publishers to create multiple communities with:
name, auto-generated ID, category, description, country, member invitation/upload, campaign access (all eligible or selected), manager assignment and Active/Paused status.

Enforce manager access only to assigned communities.

PHASE 5 — MEMBER INVITATIONS
Support:
- Individual invitation link
- Email invitation
- CSV bulk upload
- API member creation

Validate secure invitation tokens, publisher/community relationship, expiry, status and duplicate use. Validate CSV rows and return row-level errors. Make bulk operations safe to retry. An invitee must become a private Network Member, not a public Creator. Use the existing account identity if the person already exists and apply the explicit conversion/linked-membership rules.

PHASE 6 — NETWORK MEMBER PORTAL
Implement `/network/dashboard` with the member's own:
total clicks, valid clicks, signups, applications, leads, conversions, approved/pending action counts, campaign status, publisher name and assigned campaigns.

Do not display or return:
CPC price, partner payout, publisher commission, JobOrio platform fee, member financial balance or withdrawal information.

Ensure a member cannot access another member's records by changing IDs, query parameters or API requests. Apply authorization in backend queries and serializers/response schemas.

PHASE 7 — CAMPAIGNS, TRACKING AND REPORTING
Implement publisher campaign assignments and member campaign visibility based on eligibility and assignment.
Snapshot/version commission terms at assignment acceptance.
Preserve tracking IDs through redirects.
Accept approved revenue only from partner-confirmed actions.
Make partner event handling idempotent.
Represent rejected/reversed actions through ledger adjustments.
Keep publisher financial reports separate from member activity dashboards.

Inspect existing partner integrations before coding. If partner specifications are absent, do not fabricate endpoints or payloads; report the missing contract.

PHASE 8 — FINANCIALS AND INTEGRATIONS
Implement immutable publisher ledger entries and linked reversal/adjustment records.
Keep member settlement reconciliation in its separate data model.
Protect API credentials and webhook secrets using the existing secure secret-management approach.
Verify Network Members cannot access publisher financial APIs at the route, service, database-query and response levels.

PHASE 9 — TESTING
Write automated tests alongside each feature. At minimum test every acceptance item in the development document, plus:
- Unauthenticated access denial.
- Cross-publisher and cross-community ID manipulation.
- Manager access outside assigned communities.
- Expired, revoked and reused invitation tokens.
- Duplicate CSV rows and safe retries.
- Duplicate webhook delivery.
- Member attempts to retrieve financial fields through API responses.
- Member attempts to call publisher financial endpoints.
- Campaign rate changes after an assignment is accepted.
- Reversal/adjustment ledger behavior.
- Member departure, pending settlement and formal release.
- Existing Communities and API & Integration regression tests.

Run the relevant tests, linting, type checks and migrations using the commands discovered in the repository. Report commands and actual results. Do not claim tests passed unless they were run successfully.

DELIVERY PROCESS
For each phase:
1. State the goal and files/modules to change.
2. Implement only the approved scope.
3. Summarize files changed and behavior added.
4. Explain migrations and any data impact.
5. List tests added and commands run with results.
6. List unresolved questions, assumptions and risks.
7. Stop for review before moving to a major next phase.

DEFINITION OF DONE
The implementation is not complete until all acceptance tests in `JOBORIO_CURSOR_DEVELOPMENT.md` pass, restricted financial data is inaccessible to members through both UI and APIs, historical records are preserved, existing protected modules still work, and setup/deployment/integration notes are documented.

Start with PHASE 1 — DISCOVERY ONLY. Inspect the repository and return your findings and phased plan. Do not edit code yet.
```

---

## 11. Recommended way to work with Cursor

Use these follow-up instructions one at a time after Cursor completes discovery and you approve its plan:

**Approve architecture and schema**
```text
Proceed with the approved data-model phase only. Show the proposed schema and migration plan before applying migrations. Preserve existing user identities and data. Add tests for the critical uniqueness and relationship rules.
```

**Implement one feature at a time**
```text
Implement the publisher registration workflow only, following the approved plan. Reuse existing project patterns. Include validation, authorization, tests, loading/error states and any required migration. Do not start the next phase.
```

**Security review**
```text
Review the implementation for authorization and data leakage. Act as an attacker with a Network Member account. Try direct API calls, ID substitution, query manipulation and browser-response inspection to access publisher rates, payouts, commissions, platform fees, balances or withdrawals. Add regression tests for every issue found and fix only within the approved scope.
```

**Pre-release review**
```text
Run the complete relevant test suite, type checks, linting and migration checks. Verify every acceptance criterion in the development document. Report passed, failed, blocked and not-yet-tested items separately. Do not mark blocked or untested items as passed.
```

## 12. Final instruction

Treat this document as the feature specification, but treat the existing repository as the source of truth for technical architecture. Inspect first, plan second, obtain approval, and then implement incrementally. Where the requirements are silent, ask rather than inventing business behavior.
