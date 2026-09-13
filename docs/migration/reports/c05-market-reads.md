---
title: C05 Market read migration
description: Preliminary source inventory for Market analytics, separate from private provider actions.
audience:
  - contributor
  - agent
status: active
---

# C05 Market read migration

IN PROGRESS. The recommendation calculation is now feature-owned; broader Market queries, services
and screens remain legacy. This receipt is not evidence that the complete Market call graph is reviewed.

## Initial entrypoint inventory

- /market: phone detection precedes reads. Phone concurrently requests current listings, KPIs and
  four recent transfers. Desktop renders MarketPageClient, which owns its browser reads.
- /market/[section]: existing mobile route guard precedes reads. transfers uses fetchAllTransfers;
  trends uses 30-day analysis; bids and investments combine specific arrays from fetchMarketStats.
  Existing descriptions, first-20 generic record rendering and transfer links must be preserved.
- GET /api/market: validates limit (default 50, range 1–500) but does not pass it to getMarketPageData.
  Preserve this currently unused parameter contract; do not silently introduce pagination.
- GET /api/market/stats: fetchMarketStats, force-dynamic, MEDIUM success cache.
- GET /api/market/stats/value-details: transferId numeric validation, force-dynamic, MEDIUM cache.
- GET /api/market/trends: default 30; allows only 7/30/90/180/365 after numeric validation, SHORT cache.
- GET /api/market/transfers: page 1–1000, limit 1–100, trimmed buyer/seller strings, SHORT cache.
- GET /api/market/duels/details: distinct positive user/opponent IDs, force-dynamic, SHORT cache.

These handlers contain no session identity resolver. Complete transitive helper/access and returned
field review is still required before declaring their public success caching safe. successResponse
currently emits public max-age plus stale-while-revalidate; errors use the established error helper.

## Existing owners and dependencies

Two separate global services exist: services/features/marketService provides basic aggregates and
wrappers; services/marketService aggregates roughly thirty analytics queries and enriches manager
identity fields. Neither should be confused with marketActionsService (private/provider operations).
Most statistical implementations reside in db/queries/features/market.ts, mixing SQL, interfaces,
enrichment and ranking calculations. Trace every export and consumer before extraction.

Current listings query uses season-scoped market_listings, latest listed_at, player season facts,
manager seller labels and next-match SQL. It additionally invokes Team playoff probabilities,
Team game counts and Player form helpers before its SQL and scoring projection. Reuse deliberate
Teams/Players contracts, preserving these helper semantics and query order rather than copying queries.
Do not confuse Team playoff probabilities with the separate Playoffs prediction competition.

## Original-contract checkpoint

Application baseline is `23b6af65`. Added characterization tests execute all six real read
handlers with mocked service outputs, preserving permissive parseInt behavior, missing detail ID
default zero, the unused market limit, trimmed filters, public success TTLs, private error headers
and rejection before reads. The basic aggregate service tests pin its envelope, per-service defaults,
uncached repeated calls and propagated failures. Fixtures are synthetic, not production samples.

Focused Market/API plus basic service suite: 36 tests PASS across four files. Typecheck PASS.
An initial service-test run lacked the standard server-only test mock; adding that test-only mock
resolved the import failure without changing application code. These checks characterize the current
implementation; they do not establish query safety, complete data-model coverage or C05 acceptance.
The analytics service now additionally has five original-contract tests: all 31 aggregate keys and
constituent defaults, first exact-name match (including null), text manager IDs, unmatched records,
buyer aliases, two-step bidder enrichment, propagated failures and narrow-loader argument forwarding.
The second bidder currently overwrites the shared user_color_index field; this quirk is pinned rather
than silently corrected. All five tests pass against the unchanged global analytics service.

## Recommendation extraction — checkpoint A

The eight-factor listing recommendation now belongs to `src/features/market/lib`, with explicit
input/output types and a client-safe public contract. The legacy query delegates to that calculation;
its SQL, form enrichment, helper invocation order and final score/trend/price sorting are unchanged.
The pure output allowlists its calculated fields; full listing/model allowlisting is still pending.

Before extraction, five listing-query characterization scenarios were established (four before the
move, plus stable ordering after). The complete focused suite passed 100 tests across six files.
Forty-seven frozen original-score cases and ten clamp/label boundary examples exercise the extracted
formula, including exact label/color/dot/icon output. Numeric strings, nulls, truthy fallbacks and NaN
price behavior are preserved. These are not route-validation policy changes.

Additional read-only source comparison confirmed all 44 template literals remain byte-identical to
`ecb06da3`; 12,000 deterministic original/candidate formula comparisons matched every output field.
Full `npm run verify` passed: skills, graph (846 modules/52 protected entrypoints), docs, typecheck,
1,636 tests plus one existing skip, lint, database-disabled production build, 38-table schema metadata,
Drizzle check and diff check. Existing image warnings remain; no UI modules or route contracts changed.
The five analytics tests were added afterward: final typecheck, scoped ESLint and full unit rerun
passed with 1,641 tests plus one existing skip. Browser references remain required before moving screens.

## Frozen scope and next work

Private offers/accept/reject/remove/sell/sell-all, provider adapters, credentials and sync mutations
remain C11/C12. No production actions, policy changes, schema/dependency work or deployment is authorized.
Next: complete method/export/caller inventory, exact cache and serialization contracts, original
query characterization tests, then bounded query/model/service and screen ownership. Team probability
and counts still live in legacy Team queries. Player form already has a deliberate Players service;
do not add a second form query or introduce a Teams-to-Players barrel cycle while closing adapters.
