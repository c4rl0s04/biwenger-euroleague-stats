---
title: Task 06 Dashboard data migration
description: Dashboard orchestration, owning-domain read contracts and compatibility evidence.
audience:
  - maintainer
  - agent
status: active
---

# Task 06 — Dashboard data

Branch: `refactor/dashboard-data-architecture`, sibling worktree
`../biwengerstats-next-dashboard-data-architecture`. Base: `c184bee7` (including the separately
verified MapLibre fix). This is the data slice, not Task 07 screen ownership or a redesign.

## Scope and flow

Before: Dashboard pages/HTTP adapters called the global service barrel; `dashboardService.ts`
combined domain queries, preparation, personal summaries, records, News and landing statistics.

After: pages and existing HTTP adapters call `features/dashboard/server`. Bounded personal,
league, next-round and activity services compose deliberate owning-domain services. Domain
queries stay inside their owners, and explicit serializable models reach Dashboard. The phone
summary mapper is client-safe through `public.ts`; desktop cards and screen composition stay
in their existing locations until Task 07. Server pages never call internal REST endpoints.

Routes: `/dashboard` and the existing `/dashboard/{season,comparison,next-round,market,league}`
phone sections use the new data contract. The migrated HTTP adapters are:

| Existing endpoint                     | Owner / behavior                                             | Success cache                                                                   |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `/api/dashboard/birthdays`            | Players birthday projection                                  | public 300s + stale 60s                                                         |
| `/api/dashboard/rising-stars`         | Players rising-star projection                               | public 300s + stale 60s                                                         |
| `/api/dashboard/top-players`          | Players top performers                                       | public 300s + stale 60s                                                         |
| `/api/dashboard/top-form`             | Players form, limit 6 / rounds 3                             | public 60s + stale 60s                                                          |
| `/api/dashboard/market-opportunities` | Market opportunities, limit 6                                | public 60s + stale 60s                                                          |
| `/api/dashboard/mvps`                 | Rounds last-completed-round MVPs                             | public 300s + stale 60s                                                         |
| `/api/dashboard/next-round`           | Rounds selection, Matches fixtures; `{nextRound}` envelope   | public 60s + stale 60s                                                          |
| `/api/dashboard/ideal-lineup`         | Dashboard selection over Rounds statistics                   | empty input 60s; populated input 300s; stale 60s                                |
| `/api/dashboard/leader-gap`           | Standings comparison, existing URL/session identity resolver | private/no-store                                                                |
| `/api/dashboard/recent-activity`      | Market activity, domain records, optional manager alerts     | approved private/no-store correction for explicit manager; otherwise public 60s |
| `/api/league-average`                 | Standings participated-round average; `{average}` envelope   | public 300s + stale 60s                                                         |

The three accepted Manager Dashboard APIs and existing player/stat-leader browser APIs are
unchanged. No routes or aliases are added. Existing force-dynamic declarations, authentication,
section guards, errors, status codes, envelopes and loading order remain. All error responses
remain private/no-store. No request or persistent server cache is introduced.

## Ownership and compatibility

- Standings owns league-average SQL and leader-gap calculation over its mapped simple standings.
- Rounds owns last-round player/MVP SQL and the highest manager-round fact. Its original
  all-matches-finished/max-round selector remains distinct from the calendar policy.
- Matches owns round metadata, date-ordered fixtures and team-position enrichment. The existing
  caught position-calculation failure still yields fixtures with null positions. Other errors propagate.
- Market owns highest-transfer and largest-positive-price-gain facts, alongside its existing
  opportunities, transfer and price-change services. Record reads retain their original sequence
  and one shared season snapshot: Rounds captures it, then Market receives the trusted season ID.
- Dashboard owns record labels/order, five-player/max-three-per-position ideal-lineup selection,
  aggregate composition and phone summary mapping. Database nulls, numeric strings, date JSON,
  field names, ordering and fallback text remain intentional compatibility behavior.
- The existing manager streak source is an array, not a player `{hot,cold}` object: Dashboard's
  hot/cold widgets remain empty. Existing phone captain aliases are absent from the domain payload,
  so their displayed zero values remain. Neither is silently corrected in this refactor.
- Recent-activity identity keeps the first `userId`, parseInt semantics, bounds 1–999999999,
  empty-as-absent behavior and no session fallback. Only its explicitly approved HTTP privacy
  correction is separated from the structural commit.

Legacy `dashboardService.ts`, standings/records query names and last-round query names are
compatibility facades, not duplicate implementations. The legacy round-detail adapter restores
Date objects for its old server contract; feature models use JSON strings. News and landing
implementations moved unchanged to `news-landing-legacy.ts`, pending Tasks 08/09. Assistant
continues using the legacy facade until Task 20. The old mobile mapper path delegates to Dashboard
until Task 07. Final adapter retirement remains Task 25, after consumer checks.

All eleven migrated APIs are registered in architecture policy. Leader-gap adds only the same
six exact authentication/credential-infrastructure edges already approved for other session-aware
routes; no domain-query exemption or checker weakening is added. Pages are not falsely declared
composition-complete before Task 07; focused boundary tests enforce their direct Dashboard reads.

## Verification

- Baseline at `c184bee7`: preceding complete verification passed 2,280 tests plus one existing skip,
  with 24 existing lint warnings. Task-specific baseline: 13 tests passed.
- Original application browser run: all nine projects passed Dashboard overview, five phone
  sections and the eleven API availability checks. Uses synthetic disposable PostgreSQL only.
- Structural `npm run verify`: passed. Typecheck; 2,379 tests plus one existing skip; lint (same
  24 warnings, zero errors); database-disabled production build; architecture (978 modules / 80
  entrypoints); docs (101 notes); six skills; schema metadata (37 tables, no drift); Drizzle and
  whitespace checks all passed. Focused cross-feature suite: 828 tests passed.
- Stronger original-browser data assertions passed again on desktop/iPhone: exact fixture MVPs,
  ideal lineup, round fixtures/dates, leader gap, records and league average.
- Source comparison: unchanged desktop/phone composition and phone mapper runtime; identical
  News/landing function bodies, last-round emitted query bodies and three record SQL token streams.
- Dependency audit: production zero; full audit retains five moderate development findings, tracked
  in the [security receipt](../../operations/maplibre-security-upgrade.md). No dependency changes.
- Cache correction and final candidate browser acceptance remain pending at this structural checkpoint.

No dependency/schema/migration, authentication, credential, provider-operation, environment or
Vercel configuration change belongs to this slice. Integration/push and deployment are distinct;
the user currently requires GitHub push, not Vercel inspection. Native-phone/real-data production
review remains a manual follow-up. Next bounded task: **07 — Dashboard screen/component ownership**.
