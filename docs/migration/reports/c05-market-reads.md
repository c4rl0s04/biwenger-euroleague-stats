---
title: C05 Market read migration
description: Preliminary source inventory for Market analytics, separate from private provider actions.
audience:
  - contributor
  - agent
status: active
---

# C05 Market read migration

IN PROGRESS. Checkpoints A–M are locally committed through `78b77ea1`: all six scoped read APIs,
statistical queries/services/models, overview composition, non-bids phone projections, duel
presentation and the drawer boundary are feature-owned. Checkpoint N below is locally verified
for typed metric renderers and expanded drawer browser coverage. Checkpoint O verifies listing
expansion. Populated rolling charts, remaining presentation contracts, bids approval/ownership and broader
visual closure remain open. Legacy Dashboard/Assistant adapters retire with their consumers.
The initial inventory and dated checkpoints below are historical evidence, not current status.

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

### Listing presentation checkpoint P (after `5b1281ed`)

Locally accepted for listing presentation contracts. Listing composition, the front/back card and full analysis
modal are now TSX with explicit listing/selection/renderer contracts. The detail reads use
the existing Players public `PlayerProfileApiModel` through a type-only view of the same
browser hook. No new endpoint, request, transformation, cache or query is introduced.
Known optional owner/average presentation fallbacks are enumerated locally; they are not
added to the listing API. Nullable JSX/date/arithmetic assertions erase at runtime and
preserve existing behavior, including the null-name search failure rather than adding a
silent input correction. All three emitted runtime ASTs match `5b1281ed` exactly after
type/comment erasure and redundant-parenthesis normalization.

Twenty-two new focused contracts exercise filters, all six sort keys, stable ties,
nonmutating sorting, selected-player callbacks, skip flags, loading/empty states, heuristic
fallbacks and modal role thresholds. A boundary test pins the deliberate Players type
contract. Shared visual wrappers/motion and the browser hook are mocked in those unit
tests. No database,
authentication, credential, provider, dependency, schema or production change is included.

Focused Market/API/page validation passes 272 tests in 21 files. Full `npm run verify`
passes 1,997 tests plus one existing skip, graph (922 modules/60 protected entrypoints),
typecheck, skills/docs, production build, offline 38-table metadata audit, Drizzle and
diff checks. Lint initially reported one newly obsolete suppression after the TSX move;
removing only that comment leaves the 24 existing image warnings. Scoped formatting passes.
React/UI review preserves hook order, skip conditions, effect dependencies, markup and all
existing fallbacks; no performance redesign or cache change is introduced.

Both browser commands pass iPhone 13 and desktop 1440 (four cases), without any test or
snapshot edits: `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts
--project=iphone-13 --project=desktop-1440` and `npm run test:e2e:local --
tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440`. Twelve populated and
five empty-state original references remain unchanged. Both databases shut down normally;
the known bids TypeError remains visible, not fixed or suppressed. Remaining C05 work is
the desktop aggregate/chart presentation boundary, populated rolling-chart coverage,
broader viewport/Linux closure and the separately gated bids behavior/ownership decision.

### Listing interaction checkpoint O (after `cf9db91b`)

Locally accepted for listing expansion coverage. No application source changes. The populated desktop scenario
now opens “Analizar Fichaje,” waits for the real card flip and loaded Players statistics,
opens “Ver Análisis Completo,” checks the profile link and body scroll lock, closes the
modal and returns the card to its front. It uses the existing `/api/players/99311/stats`
read flow against synthetic data, not response interception or provider actions.

Two new original screenshots are retained at `a4d105cf`, with application source unchanged
from `9a2abc1c`. The capture run completed interactions and failed only for the two missing
references it created. Both subsequent original desktop repeats passed without updating
images. The quick-stat card and full modal images were visually inspected; ten earlier
populated references remain unchanged. Candidate desktop/phone comparison passes both cases;
the same known bids server TypeError remains logged, with no suppression. Original command:
`npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=desktop-1440 --repeat-each=2`.
Candidate command uses `--project=iphone-13 --project=desktop-1440` without snapshot updates.
All disposable databases shut down normally. `npm run verify` passes: skills, graph (921/60),
docs (89 notes), typecheck, 1,974 unit tests plus one existing skip, lint (24 existing image
warnings), production build, offline schema metadata (38 tables), Drizzle and diff checks.
Missing-provider build notices are unchanged. Twelve populated images and the test match
the original checkout byte-for-byte. No screenshot tolerance or error guard changed.
Listing/modal types, populated rolling charts,
broader viewport/Linux coverage and the separately gated bids behavior remain unfinished.

### Metric renderer checkpoint N (after `78b77ea1`)

Locally accepted for metric renderer contracts and drawer interaction coverage. All four metric rows, the 20-entry registry and identity
helper now have explicit TypeScript contracts. The known alias fields are enumerated rather
than accepted through an unbounded record. Current category-specific service models remain
the drawer inputs; aliases are internal compatibility behavior, not new response fields.
Registry callback/summary contracts retain presence matching, first-match order, labels,
formulae and missing-value behavior. Type-only assertions add no runtime defaults or checks.

The shared visual BaseRow also serves Predictions. It remains unchanged for C13; Market's
typed facade exports that exact same component without a wrapper or duplicated markup.
Seven emitted runtime ASTs (four rows, registry, identity helper and drawer) match `78b77ea1`
after type/comment erasure and formatting/parenthesis normalization. Thirty-six focused
tests cover every registered metric, real callback/row rendering with only the shared
visual component mocked, time formatting, zero fallbacks, identity/color precedence,
existing plural links and percentage-only summary behavior. The facade identity is tested.

No database, service, API, cache, authentication, credential or provider changes. Recovered
`npm run verify` process 55806 completed successfully: 1,974 tests plus one existing skip,
graph 921 modules/60 protected entrypoints, skills/docs, typecheck, lint (24 existing image
warnings), production build, offline 38-table metadata audit, Drizzle and diff checks pass.
The expanded browser test subsequently passes typecheck and scoped formatting. A fresh
seven-module emitted-runtime AST comparison also passes. The first original desktop run passed transfer-manager filtering but
timed out clicking the hidden tooltip copy of “El Jeque.” The test now selects visible
text and uses the actual player card label “El más fichado” (the drawer title remains
“El Más Deseado”). Both original and candidate tests receive the same locator correction;
no application behavior, error guard or screenshot tolerance changes. Original application
source still matches `df01154f` exactly. Filtering visible text alone also failed because
Playwright selected the nested tooltip; targeting the existing card-header span resolved
the locator without forcing clicks. The next run completed all interactions and wrote
only three missing original images (expected missing-snapshot exit). Both subsequent
non-updating original desktop repeats passed. References and the test are committed at
`9a2abc1c`; all seven prior images remain unchanged. Candidate populated and empty-state
comparisons pass on iPhone 13 and desktop 1440 (four cases). The browser test and ten
populated images match the original checkout byte-for-byte; five empty images are unchanged.
The following commands supply browser evidence:

- Original: `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=desktop-1440 --repeat-each=2` — two passes.
- Candidate: `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440` — two passes.
- Candidate: `npm run test:e2e:local -- tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440` — two passes.

All disposable databases shut down normally. The known phone bids TypeError remains visible
in both candidate runs, not suppressed or claimed fixed. React/UI review preserves component
identity, hooks, markup, callbacks and client-only boundaries; it introduces no cache or
performance redesign. Focused Market/API/page validation passed 249 tests in 19 files;
source formatting, documentation links and diff whitespace checks also pass.

Listing expansion, rolling charts, broader viewport/Linux closure
and the separately unapproved bids correction remain C05 work.

### Drawer boundary and section composition checkpoint M (after `876a05fa`)

Locally accepted for drawer boundary and section composition. The drawer boundary now uses category-specific Player,
Manager, Transaction and Temporal row unions from the existing explicit analytics models.
Client-local state includes the icon component and is not represented as a serializable
server response. The renderer's internal optional field view derives only from those known
models; it is not an unbounded dictionary or a new database projection. Existing profit/trade
dispatch remains supported through the existing topTrader model, despite no current opener.

`StatDetailDrawer` becomes TSX; parent state and opener receive the same typed contract.
Emitted runtime ASTs for both components match `876a05fa` after erasing types/comments and
ignoring formatting, redundant parentheses and punctuation-only differences. All filter
precedence, strict IDs/name fallbacks, global ranking indices, summary rules, state/effects,
portal and motion behavior remain unchanged. Ten render contracts exercise the drawer with
controlled state and mocked row/metric rendering; they do not claim full renderer/browser
coverage. Negative compile-time assignments reject mismatched row categories.

The phone scaffold/descriptions now belong to `MarketSectionScreen`; the page only composes
the screen with its typed rows or explicitly pending legacy bids content. Five original/new
render comparisons preserve descriptions, headings, back links and content, including the
existing no-description fallback. Guard/error and bids behavior are unchanged.

Focused tests pass 211 cases. Full `npm run verify`, including the additional ownership
assertion, passes 1,937 tests plus one existing skip, graph (920 modules/60 protected
entrypoints), typecheck, skills/docs, lint (24 existing image warnings), production build,
offline 38-table metadata audit, Drizzle and diff checks. Missing-provider notices are unchanged.
No graph timeout occurred in this full run. The following browser commands both pass two
cases, with all five empty-state and seven populated original images unchanged:

- `npm run test:e2e:local -- tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440`
- `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts
--project=iphone-13 --project=desktop-1440`

The populated run retains listing-name filtering, transfer-drawer opening/Escape dismissal and duel
click/keyboard/reverse-selection checks. Both disposable databases shut down normally.
The existing phone bids TypeError remains visible in both logs; it is neither fixed nor
suppressed. A type-only model formatting issue was corrected and its check then passed;
scoped formatting, documentation and diff checks pass. React/UI review retains the original
hooks, state reset, scroll lock, keyboard handlers, motion and markup without new caching.
Remaining C05 work includes renderer/metric internals, additional drawer/listing/rolling-chart
browser coverage, all-viewports/Linux closure and the unapproved bids behavior/ownership decision.

### Phone read projection checkpoint L (after `be0c2e5b`)

Locally accepted for non-bids row projection. Transfers, trends and investments now call a feature-owned
section service and receive explicit row models. The mapper preserves the old generic list's
20-row cap, ordering, label/null precedence, value formatting and transfer links. Trends keeps
its existing ordinal-only display; exposing additional trend fields is not part of this move.
The service retains no cache, no identity lookup, default transfer query arguments, 30-day
trend selection and the same complete analytics read for investments. No query changes.

The page still calls `requireMobileRoute` before any read, preserving unknown-route handling
and desktop redirects. Its bids path is explicitly retained with the existing non-iterable
duel-object failure and loose legacy contract pending the separate behavior decision. No unsafe
iterable cast, fabricated empty result or error suppression makes that path appear migrated.
All section reads now reach the feature server contract; the page is registered in graph
enforcement without an exception. The global list remains for other features and legacy bids.

Tests compare actual legacy/new row HTML, limits, links, nulls and serialization; service tests
cover dependency selection, arguments, ordering, failures and repeated uncached reads. Page
tests retain the bids TypeError and guard-before-read behavior and add typed-model forwarding.
Full verification and unchanged original browser comparisons are recorded below.

Focused Market/API/page tests pass 196 cases. The first full run passed 1,920 tests and
failed only the actual-source graph test's 5-second timeout (one existing skip). The same
graph test run alone passed all eight cases in 3.38 seconds. A fresh full `npm run verify`
then passed 1,921 tests plus one existing skip, typecheck, graph (918 modules/60 protected
entrypoints), skills/docs, lint (24 existing image warnings), production build, offline
38-table metadata/Drizzle checks and diff check. No timeout, assertion or policy was relaxed.
This supports load-sensitive timing, not a proven underlying cause or a checker fix.
Browser acceptance passed with no reference changes:

- `npm run test:e2e:local -- tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440`:
  two passed, all five original empty-state images unchanged.
- `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts
--project=iphone-13 --project=desktop-1440`: two passed, all seven original populated
  images unchanged, including transfers/investments and desktop transfer/duel interactions.

Both runners shut down their disposable databases normally. The pre-existing bids TypeError
remains in both server logs; no clean-all-Market-logs claim is made. Existing source comparisons
cover the ordinal-only populated trend output; rolling chart/browser data and all-viewports/Linux
closure remain outstanding. Scoped formatting and diff checks pass. React/UI review keeps a
stateless row component, existing semantics/classes and no new fetching/cache layer.
Remaining C05 work includes bids approval/ownership, full section screen composition, drawer
contracts/categories, listing expansion, rolling charts and final visual/adapter closure.

### Duel presentation checkpoint K (after `7cfad1e0`)

Locally accepted. `MarketDuelSelection` connects the parent selection state, typed matrix and
typed detail card. The two components become TSX, with a local type-only adapter describing
the existing fetch hook's nullable key and optional options correctly; the shared hook
and actual browser cache behavior are untouched. Three emitted JavaScript ASTs match
their original components after type/comment erasure and redundant-parenthesis/formatting
normalization. No rendered markup, handler or runtime helper changes are intended.

Nine focused render cases cover absent selection, directional URLs/symmetric cache key,
loading/error/empty states, details, keyboard-accessible matrix labels and unchanged
null-name sorting failure. The original `.js` JSX files cannot be imported by the current
Vitest parser; the tests run against TSX with shared visual primitives mocked, while real
browser comparisons use the original application. Focused Market/API tests pass 174 cases;
typecheck and architecture pass (914 modules/59 protected entrypoints).

The original browser test now exercises click selection, clear, Enter/Space toggling,
reverse selection and four real detail rows. The first new screenshot capture writes a
reference and exits failed for the missing snapshot. Its two non-updating repeats then
failed on a small text rasterization difference; that initial run was not acceptance.
Pixel-alignment did not change the two failures, and that probe was removed. Moving the
resting pointer before scrolling details into view resolved the mismatch. The original
capture command with update mode passed without rewriting the new image (its original
creation timestamp remained unchanged); two subsequent non-updating original repeats
passed, including click/clear, Enter/Space and reverse-pair interaction. This supports an
accidental hover/resting-state capture issue, not an application rendering change.
No screenshot tolerance, error guard, application CSS or behavior is relaxed.

Candidate populated comparison passes both iPhone 13 and desktop 1440 using the exact
original test and seven reference images. The existing phone bids TypeError remains in
server logs; neither this checkpoint nor those browser passes claim it is fixed. The
React review retains hook order, functional selection updates, keyboard handlers and
client-safe imports; no new rendering or fetching behavior is added.
The first full verification run failed only the existing five-second graph-test timeout
while browser builds were running (1,902 tests passed, one failed, one skipped). An
isolated full rerun was required; no test timeout, assertion or graph policy is changed.
The previous isolated process handle was unavailable when work resumed; its final exit
could not be recovered. A fresh isolated `npm run verify` completed successfully before
checkpoint acceptance: 1,903 tests passed and one existing skip, typecheck, graph (914
modules/59 protected entrypoints), skills, 89 documentation notes, lint (zero errors and
24 existing image warnings), production build, 38-table offline schema metadata audit,
Drizzle check and diff check all passed. Existing missing-provider build notices remain.
The timeout did not recur; resource contention is a plausible explanation, not proven causality.

Original browser evidence is retained at `df01154f`: `npm run test:e2e:local --
--fixture=market tests/e2e/market-populated.spec.ts --project=desktop-1440 --repeat-each=2`
passed both repetitions. The candidate command with `--project=iphone-13
--project=desktop-1440` passed both cases. All seven images and the browser test were
rechecked byte-for-byte against that original checkout when closing this checkpoint.
These checks accept duel presentation only; the remaining C05 scope below stays open.

### Shared form checkpoint J (after `efcb5eef`)

Locally accepted. `features/player-form` owns the single finished-team-match
form query, explicit row/model, DNP calculation/allowlisting mapper and server-only service.
This leaf is shared by Teams and Players; Market keeps consuming the existing Players
service contract. Importing the whole Players feature from Teams would introduce the
existing reverse Profile dependency as a cycle. No domain exception or duplicate query is
introduced. The Map is a server-side lookup only; existing screen services still expose
their unchanged plain serializable projections.

The three catalogue/top-player/form-ranking enrichment routines and Team roster enrichment
now belong to their feature service layers. Queries accept explicit seasons and return
metadata rows; services preserve the original independent form-season resolution, query
order, parallel reads, double ranking candidate limit and numeric/null conversions.
Season-resolution infrastructure is exposed by query adapters, not imported by services.
The legacy form file, its database-barrel export and the obsolete Players form query adapter
are removed. No remaining runtime caller uses those paths. Two obsolete Market test mocks
are removed; actual Players contract mocks remain unchanged.

Before extraction, 50 focused tests passed including eight new original-form cases. A
read-only executable comparison against `efcb5eef` passed 36 combinations of empty/populated
form/metadata, comparing exact outputs AND ordered SQL strings, parameters and season calls.
The first graph check rejected three direct service imports of season infrastructure; these
were corrected through owned query exports, not policy changes. The graph then passed
(913 modules/59 entrypoints). Final focused validation passes 325 tests across Players,
Teams, Market, the new shared form boundary and read-foundation contracts. A separate
AST comparison confirms all five extracted SQL template strings exactly match `efcb5eef`.
Full `npm run verify` passes: 1,894 tests plus one existing skip, typecheck, graph,
lint (24 existing image warnings), database-disabled build, 38-table schema metadata,
Drizzle and diff checks. Missing-provider build notices remain unchanged. Documentation
links and formatting pass after recording the shared ownership decision.
Focused command: `npm run test:run -- src/features/player-form src/features/players
src/features/teams src/features/market src/lib/db/queries/features/market
src/tests/architecture/read-foundations.test.ts --maxWorkers=2`.
Browser acceptance passes four cases with `npm run test:e2e:local --
tests/e2e/feature-screens.spec.ts tests/e2e/market.spec.ts --project=iphone-13
--project=desktop-1440` and two cases with `npm run test:e2e:local -- --fixture=market
tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440`.
All existing Team/Matches/Market references remain unchanged; no page/component source
changed. Both disposable databases shut down normally. The existing bids TypeError remains
visible in Market runs, not suppressed or claimed fixed. Full-viewports/Linux and remaining
Market interactions/sections are still required; this closes shared form ownership only.
No UI, external contract, formula, auth, private operation, schema or dependency changed.

### Populated browser checkpoint I (after `b8fea457`)

The disposable browser runner now accepts a fixed `--fixture=market` scenario. Default
fixtures are unchanged. Unknown/ambiguous selectors are rejected; no arbitrary seed path
or external environment is accepted. The extra static facts run inside the existing
fresh-loopback database transaction and cleanup. They add three listings, five historical
transfers (including a profitable sale and a loss), four losing bids and season facts.
Application code, schema, credentials and provider operations are unchanged.

The dedicated browser test uses the real aggregate HTTP service and browser UI. It covers
three listing models, five ranked transfers, nonempty profit/loss rankings, two duel users,
phone overview/activity/transfers/investments, desktop name filtering, and opening/closing
the transfer-ranking drawer with Escape. Other drawer categories, listing expansion,
duel selection/details and rolling-trends charts remain outstanding, not implied covered.
Historical fixed dates intentionally leave the rolling trend window separate.

Original references are captured only in the retained original-application worktree.
Initial test corrections: record-transfer ranking includes Mercado purchases (five rows,
not two); the card title shares a span with tooltip text and needs a non-exact locator.
Phone activity uses content-visibility:auto, so its original capture is made while centered
in the viewport, clear of the fixed dock, rather than accepting blank offscreen rows.
No CSS, accessibility behavior, error guard or application failure was suppressed.

Original reference commit `c9f609d5` retains unchanged application source from `ba37d245`
(the pre-overview implementation). Six original images were visually inspected; all six,
plus the six fixture/test files, are byte-identical in the campaign checkout. Both original
and candidate passed four non-updating cases with `npm run test:e2e:local -- --fixture=market
tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440 --repeat-each=2`.
The existing bids TypeError appeared in both server logs; no claim of clean Market logs or
bids acceptance is made. Both disposable databases shut down normally.

The scenario/safety unit suite passes 15 tests. Full `npm run verify` passes: graph
907 modules/59 protected entrypoints, typecheck, 1,872 tests plus one existing skip,
lint (24 existing image warnings), production build, 38-table metadata audit, Drizzle
consistency and diff checks. Missing-provider build notices remain unchanged.
Default-fixture regression passes both cases with `npm run test:e2e:local --
tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440`; all five empty-state
references are unchanged. The known bids error remains in this run too, with normal
disposable database shutdown. Documentation checks pass all 89 notes; scoped formatting
and `git diff --check` pass. Checkpoint I is accepted only for this bounded fixture/browser
coverage, not complete Market migration or all-log acceptance.
Dedicated scenario execution is required in
addition to the default browser run; C14 must wire it into final verification/CI coverage.

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
Next: finish desktop aggregate/chart presentation contracts and populated
rolling-chart coverage. Overview and section entrypoints
are already registered; bids remains an explicit unresolved behavior/ownership decision.
Retire compatibility wrappers only after their final consumers move;
Dashboard and Assistant callers remain assigned to their later packages. Team competition metrics
have owned contracts and Market uses the deliberate Players form service. Shared form ownership
is closed by checkpoint J's leaf contract, without duplicate SQL or a Teams-to-Players cycle.
Neither this data checkpoint nor passing unit/build checks alone completes Market visual acceptance.
