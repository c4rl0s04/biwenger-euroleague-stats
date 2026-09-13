---
title: C05 Market read migration
description: Preliminary source inventory for Market analytics, separate from private provider actions.
audience:
  - contributor
  - agent
status: active
---

# C05 Market read migration

IN PROGRESS. Recommendation scoring plus five scoped read APIs are now feature-owned: trends,
transfer history, value details, duel details and the basic summary. The large stats aggregate,
its remaining queries/helper dependencies, recent activity/opportunities and screens remain legacy.
This receipt is not evidence that the complete Market call graph is reviewed.

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

## Trends read boundary — checkpoint B

Predecessor `deda942d` owns the accepted scoring extraction. The existing GET `/api/market/trends`
now calls the Market service and edge validator directly. Typed query records are mapped to an
explicit nested allowlist with established snake_case fields, nullable player names/prices and
integer truncation. Null aggregates retain their existing JSON null behavior (NaN before JSON),
not invented zero values. SQL, season resolution and chronological/transfer ordering are unchanged;
the extracted SQL template is byte-identical to the predecessor.

The former query function is a temporary re-export, not a second implementation. Existing global
service callers (Market overview/section and Assistant) therefore use the same feature service.
Internal 14-day reads remain supported; only the HTTP selector limits windows to 7/30/90/180/365.
Its numeric-prefix parsing, default, errors, public max-age 60/stale 60 and private error headers
are unchanged. No new Next dynamic/revalidation export or server cache was added.

The reviewed trend path has no session/cookie resolver, provider call or mutation: it reads configured
season-scoped transfer/player statistics. Its inputs are days and the application season, not viewer
identity. This supports preserving its public policy; it is not a blanket security conclusion for
all Market responses. New tests run the real handler/service/mapper against a mocked database,
including ignored identity query/cookie inputs, empty/error behavior and boundary validation.

Focused suite PASS: 127 tests across nine files. Full unit phase PASS: 1,665 plus one existing skip.
One old route test initially mocked only the global service, causing a refused localhost connection;
the mock now targets the new feature contract and the suite passes. No database was connected or
mutated. Architecture PASS: 852 modules/53 protected entrypoints, including trends with no exception.
Final `npm run verify` PASS: skills, graph, docs, typecheck, all 1,665 tests (one existing skip),
lint (zero errors, 24 existing image warnings), production build with SKIP_DB, source/schema metadata
(38 tables, no drift), Drizzle consistency and diff checks. Missing-provider build notices are unchanged.
Documentation checks passed after updating this receipt. No UI was moved and no browser run is claimed;
the original/candidate visual comparison remains part of the later screen migration.

## Transfer/detail and summary reads — checkpoints C/D

Source baseline `e3dad14b`; both checkpoints share one acceptance run. GET `/api/market/transfers`,
`/api/market/stats/value-details`, `/api/market/duels/details` and `/api/market` now call Market services.
Six original query implementations were replaced with compatibility re-exports to those services;
the global basic getMarketPageData aggregator was also replaced, so there is one implementation.
Existing global wrappers remain for unmigrated consumers; their retirement stays in C05/C14.

New bounded subareas:

- Transfer reads: explicit records, serializable models, field-allowlisting mappers, services and
  edge validators for paginated history, ownership-window point details and historical bidding duels.
- Basic activity: queries/mappers/services for all transfers, fecha-based daily trends and KPIs,
  plus the original three-read parallel summary. This remains distinct from timestamp trend analysis.

Compatibility preserved: text transfer-manager IDs versus numeric duel IDs; nullable joined fields;
date JSON serialization; numeric truncation/fallbacks; missing detail IDs defaulting to zero; first
query values and numeric prefixes; page/limit defaults and bounds; all/Todos filter sentinels;
existing SQL wildcard semantics; the summary's validated but unused limit; row ordering, count-error
propagation, response envelopes/statuses, detail force-dynamic declarations and 60/300-second caches.
No request/persistent server cache was added. All nine SQL/filter templates from the six functions
are byte-identical to the baseline; injected filter text stays in bound parameters.

Security-guided review covered the explicit public read boundary, not frozen provider commands.
The paths use only configured-season historical fantasy/statistical SELECTs and display identities.
They do not resolve viewer sessions or select account/credential records. Synthetic tests cover
cookie-invariance, input rejection before reads, bound filter values, excluded extra fields and
generic private errors. Existing logging behavior was not expanded or suppressed.

Before edits, eight original query scenarios passed. The two original aggregate orchestration tests
were moved from the obsolete global implementation to the feature's real query/mapper/service suite;
legacy wrapper tests remain. Focused combined suite PASS: 170 tests across 12 files. Typecheck and
architecture PASS (863 modules/57 protected entrypoints); four handlers added with no exceptions.
Final `npm run verify` PASS: skills/docs/architecture, typecheck, 1,712 tests plus the existing skip,
lint (zero errors, 24 existing image warnings), SKIP_DB production build, 38-table schema metadata
and Drizzle consistency, and diff check. Missing-provider build notices remain unchanged.
No browser run is claimed: no screen source moved, and original/candidate visual verification remains
required in the screen checkpoint. No auth/provider/schema/dependency/configuration or release changes.

## Checkpoint E — Team competition ownership

Predecessor: `d67f2e7b`. Team match counts and qualification probabilities now have
Team-owned records, SELECT queries, a pure mapper and services exposed through Teams/server.
Market consumes that deliberate contract; the old Team query exports only forward these four
helpers. Team Profile detail orchestration moved above its query layer so queries do not call
services. Internal assembled records stay server-side and the existing profile mapper still
produces the public view model. No new cache, identity policy or UI behavior is introduced.

Original helper and profile orchestration characterization passed before extraction. The
expanded Teams/Players/Market focused suite passes 197 tests in 25 files; typecheck passes.
All five competition and three profile SQL templates match the predecessor exactly. A read-only
deterministic comparison of the original function and extracted mapper passes 500 generated
standings/form/opponent cases. Added formula tests cover thresholds, absent form/tenth place,
duplicate opponents, numeric counts and clamping. Graph passes at 870 modules/57 entrypoints.
The initial placement of internal facts under server/models was correctly rejected by the
presentation rule; they now live under server/records, with no policy exception or weakening.

Full `npm run verify` PASS: skills, docs, architecture, typecheck, 1,742 unit tests plus
one existing skip, lint (zero errors/24 unchanged image warnings), database-disabled production
build, 38-table metadata audit, Drizzle consistency and diff check. Missing-provider build notices
remain unchanged. This accepts checkpoint E only, not the incomplete Market feature.
No browser comparison is claimed because no presentation source changed. Market screen and
campaign-wide visual acceptance remain outstanding.

## Checkpoint F — Listing and opportunity services

Predecessor: `51f84bf6`. Current listings and available-player opportunities now use owned
Market queries, explicit records, allowlisting mappers and bounded catalogue services. The
legacy functions/types forward to the feature; Market aggregate, Dashboard and Assistant
wrappers retain their names/defaults. Market no longer imports the global Player form helper.
Its service uses Players/server and Teams/server, without a cross-feature internal import or
new cycle. The underlying shared Player form implementation still has Team and Player callers;
its remaining ownership closure is not claimed complete by this checkpoint.

Preserved: opportunity SQL limit 100/default output 3 and caller-provided slicing, three-round
penalized form versus listing five-round played-game average, stable recommendation/value/trend
ordering, independent season resolutions, helper-before-listing SELECT order, nullable joined
facts, numeric compatibility fields and existing no-cache/error behavior. Listing match dates
become ISO strings at the mapper boundary with unchanged JSON values. No extra SQL columns can
escape via row spreading. No handler, screen, authentication or private operation was changed.

Before extraction, the six listing/trend and two opportunity characterization cases passed.
The new baseline test initially needed the normal server-only test mock; no application defect
or database access was involved. After extraction, focused Teams/Players/Market validation passes
199 tests in 26 files and typecheck passes. Both catalogue SQL templates match the predecessor;
500 opportunity and 500 listing JSON comparisons match the original implementation. Tests cover
allowlisting, serializable dates, domain contract inputs, missing form, limits, ordering and
season/helper/query failures. Graph passes at 875 modules/57 entrypoints with no new exceptions.
The first full run exposed an obsolete empty Player-form mock in the transfer compatibility
suite. It now stubs the deliberate Players contract and throws if transfer reads accidentally
request form; all eight transfer cases pass. The rerun passes 1,751 unit tests plus one existing
skip. Full `npm run verify` PASS: skills/docs/architecture, typecheck, full unit suite, lint
(zero errors/24 unchanged image warnings), database-disabled production build, 38-table schema
metadata audit, Drizzle consistency and diff check. Missing-provider build notices are unchanged.
No browser run is claimed for this data-only checkpoint; original/candidate Market screen
verification remains required before accepting C05 as a complete feature.

## Checkpoint G — Remaining analytics, activity and aggregate HTTP flow

Predecessor: `feeca992`. All remaining Market statistical SQL now lives in owned query layers:
summary rankings/manager finances, auction outcomes, investment histories, recent activity/price
changes and overview/duel facts. Thirty read functions were migrated, comprising 31 unchanged
SQL templates. Explicit records and allowlisting mappers replace raw-row spreading; public models
include real nullable/text-ID/team-label/transfer metadata previously omitted by legacy declarations.
The distinct bounded services feed one typed aggregate composition, not a giant query service.

The aggregate reuses Managers/server directory data and preserves first exact-name matching
(including null), buyer aliases, unmatched rows and winner-then-runner color overwriting. All
31 aggregate keys and original constituent defaults/order remain. GET `/api/market/stats` uses
the owned service with unchanged force-dynamic, 300/stale-60 public success and private generic
failure behavior. All six scoped Market read APIs now use feature services. The global Market
query file contains forwarding exports only; the legacy Market analytics service keeps just
forwarding wrappers needed by current pages and other consumers.

Preserved read quirks include Record Bid's warning/empty query-error fallback but propagated
season errors; KPI missing-row failure; integer truncation versus fractional metrics; null/NaN
JSON behavior; active-directory ordering; duel symmetry, unknown participant filtering, tied
leaders and ranking rules; unused price-change hours argument; query/output limits and season
scoping. No cache, validation, authentication, provider, schema, dependency or UI policy changed.
The security-guided output review keeps display/statistical data only and tests extra-field
exclusion with synthetic canaries. No production database/provider operations were performed.

Baseline: 27 frozen synthetic query-output fixtures executed against original functions, then
four original overview/duel scenarios before their extraction. Candidate tests add empty/error,
season, field-exclusion and real aggregate-to-HTTP checks. Focused PASS: 247 tests; typecheck and
graph PASS (904 modules/58 protected entrypoints), with no added exceptions. All 31 SQL templates
match the predecessor byte-for-byte. The first full run found three obsolete partial Player mocks
in legacy Market tests; isolating their unused Managers contract fixes all 16 affected cases
without changing runtime code. Full `npm run verify` rerun PASS: skills/docs/architecture,
typecheck, 1,850 tests plus the existing skip, lint (zero errors/24 unchanged image warnings),
database-disabled production build, 38-table metadata audit, Drizzle consistency and diff check.
Missing-provider build notices remain unchanged. No browser or visual acceptance is claimed;
the screen checkpoint must compare original and candidate desktop/mobile output.

## Screen baseline checkpoint — source `91a3ea7f`

Market page and component sources are identical to main `354f66e1` (an empty scoped
Git diff confirms this). Before moving presentation, five macOS empty-state references
cover desktop overview and phone overview/transfers/trends/investments. These do not
cover populated listings, analytics drawers, all viewports or Linux, and are not C05
acceptance. No application source or synthetic database fixture changed in this checkpoint.

Two real-page characterization tests pass: the mobile guard precedes reads, and bids
throws TypeError when the real `BiddingDuelsStats` object is spread as an iterable.
This is pre-existing in unchanged main screen source. Its behavior correction needs
explicit approval; do not silently flatten or omit duel data during migration. The
browser runner also observes this server failure during automatic phone-link prefetch;
its browser/API guard does not detect every RSC-prefetch server failure. A green
empty-state browser test therefore does not establish clean application logs.

Typecheck and the two focused section tests pass. References were captured against the
unchanged screen source; the initial desktop test selector matched both navigation and
heading and was corrected to select the heading, without an application change.
Fresh non-updating comparison PASS: `npm run test:e2e:local -- tests/e2e/market.spec.ts
--project=iphone-13 --project=desktop-1440` (two tests, five unchanged screenshots).
The disposable production build passed and the runner stopped its database normally.
Missing-provider notices remain; this run also logged two destination-stream-close errors.
No guard was suppressed and no clean-log claim is made. Populated-data, drawer, bids,
Linux and full-viewport acceptance remain outstanding. Formatting, documentation-link
and diff checks are required for this test/evidence commit; no new runtime implementation
is claimed and the prior G full-suite result remains the last full application acceptance.

## Still required for C05

### Overview ownership checkpoint H (after `3e4b43a3`)

The `/market` overview is now a thin typed adapter. Phone composition calls
`getMobileMarketOverview` directly; the service starts the same listing, basic KPI and
four-transfer reads in parallel, with independent season resolution and no new cache or
identity lookup. Desktop retains its browser `/api/market/stats` loading/skeleton and
interactive requests rather than adding an SSR aggregate read. Existing app protection
and all HTTP contracts remain untouched.

All 49 desktop Market modules moved to feature components with identical emitted
JavaScript. Existing card data props receive JSDoc contracts from the typed analytics
model where directly connected to the aggregate. The phone overview now accepts
`MobileMarketOverview`, not `Record<string, any>`. Its dead `transfer.name`/`transfer.price`
fallbacks were removed: the existing allowlisting RecentTransfer mapper never returns
those keys. The actual null-name/price fallbacks, ordering, row limits, formatting and
links remain. A 1,000-case original/current element-tree comparison matches using
service-owned fields; three populated/empty render tests cover those semantics.

The overview entrypoint is registered without a new graph exception. Public exports
contain screens/models and server exports contain the orchestration. Eight additional
service/page cases cover parallel calls, exact limits, failure propagation, no caching,
desktop no-read and phone model forwarding. The pre-existing bids section is unchanged
and remains outside this overview checkpoint pending its explicit behavior decision.

Full `npm run verify` PASS: skills/docs, graph (907 modules/59 protected entrypoints),
typecheck, 1,864 tests plus one existing skip, lint (zero errors/24 existing image warnings),
database-disabled production build, metadata audit (38 tables, no drift), Drizzle and
diff check. Missing-provider build notices remain unchanged. Scoped source formatting
also passes. Candidate `npm run test:e2e:local -- tests/e2e/market.spec.ts
--project=iphone-13 --project=desktop-1440` matched the five original screenshots:
desktop passed, but phone failed the unchanged browser-error guard on Dashboard and
Standings RSC prefetch access-control/cancellation messages. The known bids TypeError
also appeared in server logs. That first run is not clean browser acceptance. An isolated
original checkout at `3e4b43a3` reproduced the same error class in one of three phone runs
(Home/Schedule/Dashboard prefetch messages). The test now follows real section/back links
instead of replacing the document with `page.goto` between sections. No app fix, prefetch
interception, error filtering or reference-image update was introduced. The unchanged
original then passed all three repeats. Baseline test commit `ba37d245` on
`chore/market-visual-baseline` preserves that evidence with original application source.
The candidate then passed all six repeats (three iPhone 13 and three desktop 1440)
with `npm run test:e2e:local -- tests/e2e/market.spec.ts --project=iphone-13
--project=desktop-1440 --repeat-each=3`. All five reference images are unchanged;
the existing bids TypeError remains visible in server logs, as on the original.
This supports the document-replacement/prefetch explanation for the test failure,
not a claim that all possible browser cancellations or Market errors are fixed.
Both disposable runners stopped their databases normally. The React/UI review retained
parallel fetching, existing client state and markup; no cache, redesign or hook change
was introduced in application code. This accepts overview ownership only, not full C05.
Populated-browser/drawer, section migration, full-viewports/Linux and
remaining adapter/shared-helper closure are still required for complete C05 acceptance.

Private offers/accept/reject/remove/sell/sell-all, provider adapters, credentials and sync mutations
remain C11/C12. No production actions, policy changes, schema/dependency work or deployment is authorized.
Next: finish Market section ownership, remaining presentation contracts and populated/drawer
original-reference browser comparisons. The overview is registered; register the section
entrypoint after reconciling its loading/error/section behavior and approved bids decision.
Retire compatibility wrappers only after their final consumers move;
Dashboard and Assistant callers remain assigned to their later packages. Team competition metrics
have owned contracts and Market uses the deliberate Players form service. Shared form still has
non-Market callers: close that ownership without duplicate SQL or a Teams-to-Players barrel cycle.
Neither this data checkpoint nor passing unit/build checks alone completes Market visual acceptance.
