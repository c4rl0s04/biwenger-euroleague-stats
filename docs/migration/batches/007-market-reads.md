---
title: Batch 007 — Public Market reads
description: Sequential Market read migration with a pinned recommendation extraction checkpoint.
audience:
  - agent
  - maintainer
status: active
---

# Public Market reads

**IN PROGRESS — coordinator only, sequential campaign C05.** The historical pilot restriction is
superseded by the approved completion campaign, not by authorization for private operations.

## Checkpoint A — recommendation calculation

- Base: `ecb06da3`, descendant of campaign base `354f66e1` and C04 acceptance `204dd5bd`.
- Branch/worktree: `refactor/architecture-completion`, `../biwengerstats-next-architecture-completion`.
- Single owner: current coordinator. No parallel write reservations or worker dispatch.
- Evidence/resume: [C05 receipt](../reports/c05-market-reads.md); inspect Git before resuming.
- Allowed application edits for this checkpoint: extract the pure recommendation calculation from
  `src/lib/db/queries/features/market.ts` to `src/features/market/lib`, expose its client-safe typed
  contract through `public.ts`, and replace the original calculation with that contract.
- Allowed tests/docs: original listing-query characterization, pure formula tests, this assignment,
  C05 receipt and campaign status. No page, handler, SQL, provider, schema or dependency edits here.
- Actual consumers: `fetchCurrentMarketListings` and `fetchMarketStats` in the global Market service;
  phone `/market` and GET `/api/market/stats` ultimately consume these recommendations. Both retain
  their current compositions, HTTP contracts and query orchestration during this checkpoint.
- Formula inputs: existing listing stats, Team count/probability lookups, and Player form enrichment.
  The calculation receives values, not another feature's internals. Keep all helper reads and their
  ordering unchanged until their deliberate server contracts are established in the next checkpoint.
- Preserve numeric parsing, zero-probability fallback to 50, neutral/missing form behavior, all eight
  weights, clamping, rounding, exact labels/colors/icons and stable score/trend/price ordering.
- Tests: pin original query output and ordering/failure behavior before extraction; compare every
  threshold and representative malformed/null/numeric-string input against the frozen formula.
- Checks: focused Market tests, typecheck, architecture, lint, diff and full source acceptance before
  claiming the package verified. Browser baseline/candidate verification is required when screens move.
- Stop if extraction needs policy/formula changes. The checkpoint is not completion of C05.

## Remaining C05 execution

### Checkpoint J — Shared Player form ownership

Predecessor `efcb5eef`. Establish a leaf `features/player-form` boundary for the existing
finished-team-match form projection used by Teams, Players and indirectly Market. This
is demonstrated shared read ownership, not a new page or API. A Teams import of the full
Players barrel would create Teams → Players → Teams; do not add an exception or duplicate SQL.
Own the query, typed row/model, DNP mapper and uncached season-aware service in that leaf.
Move roster/catalogue enrichment orchestration above their respective queries. Retain
Players' existing public service contracts and all current view models, limits, ordering,
independent season resolutions and parallel/sequential read behavior. Remove the legacy
form implementation and obsolete Players query adapter after all consumer checks.
Validate original/new outputs and exact SQL/call order, mapper/service/error contracts,
cross-feature consumers, graph, full verification and affected browser regressions.
No section/UI, credentials, schema, provider, HTTP or cache-policy change is included.

### Checkpoint I — Populated Market browser evidence

Predecessor `b8fea457`. Add an explicit `--fixture=market` scenario to the existing
guarded disposable runner, leaving default fixtures and application code unchanged.
Repository-owned synthetic listings, profitable/loss-making transfers and rival bids
exercise real queries/services, phone summaries/sections and desktop filtering/rankings.
Capture originals only in the retained `chore/market-visual-baseline` checkout, then
compare the candidate without updating references. Preserve browser error guards.
Validate scenario parsing/unsafe selector rejection, typecheck, both fixture paths and
browser behavior. Historical fixed dates deliberately leave rolling trends separate.
Remaining drawer categories/player expansion/duel and temporal-chart coverage must stay
explicit until actually exercised; this does not approve a bids behavior correction.

### Checkpoint H — Overview screen ownership

Predecessor `3e4b43a3`. Move Market desktop components unchanged into the feature and
the phone overview into a typed screen. Move its three-read orchestration into an owned
service, preserving parallel listing/KPI/recent-transfer reads and the explicit limit four.
Keep desktop browser fetching/loading behavior and all card interactions unchanged.
Register the overview page and test its phone/desktop service boundary. Scope includes
these components, models/services/tests, public/server exports and the overview adapter.
The section route remains unchanged pending a separate bids behavior decision; its
temporary legacy imports remain tracked rather than weakened through graph exceptions.
Original empty-state references are committed. Populated-screen/drawer original-reference
and cross-platform coverage remain required before accepting the complete feature.

### Checkpoint E — Team recommendation dependencies

Base `d67f2e7b`; coordinator only in the existing campaign worktree. Own the four legacy Team
match-count/probability helpers in Teams query/mapper/service layers and expose a deliberate server
contract for Market. Move Team Profile detail orchestration out of its query module into a service
so this closure does not introduce query-to-service dependencies. Keep original detail/roster models,
cache policy, strict route IDs and all SQL/read order unchanged. The unused legacy getTeamById is
outside this checkpoint; do not delete unrelated helpers without the final consumer audit.

Allowed files: core/teams helper implementations, Teams competition/detail query/record/mapper/service
files and related internal imports/tests, Teams server/public contracts, the Market helper import and
its test mock, and campaign docs. No Team or Market UI, schema, credential or provider changes.

Five original competition tests and two complete Profile fact-assembly tests pass before edits.
Preserve Number-based helper coercion independently from strict Team route validation; neutral/zero
fallbacks; three sequential same-season probability reads; separate home/away ranking windows;
missing tenth-place behavior, form adjustment, distinct ranked-opponent averaging and 1–99 clamping.
Run focused Teams/Market/cross-feature tests plus full acceptance. A feature-folder move alone is not
acceptance; old implementations must delegate to the single owned service rather than duplicate it.

### Checkpoint D — basic Market summary (combined acceptance with C)

Original base remains `e3dad14b`; C is implemented and awaiting the combined acceptance run.
Allowed additional edits: `getAllTransfers`, `getMarketTrends`, `getMarketKPIs` and corresponding
types in the legacy query module, the global basic `getMarketPageData` orchestration (replace with
a feature re-export), GET `/api/market`, its tests, new Market activity boundary files and policy/docs.
No changes to current-listing queries, opportunity/form helpers, other features or screens.

The basic summary is three parallel configured-season reads. All transfers preserves nullable
transfer facts and default limit 100/offset zero. Daily trends uses fecha (not the separate richer
timestamp-based analysis), first 30 dates ascending, integer counts and float averages. KPIs preserve
their zero fallbacks. The route's limit defaults to 50 and is validated but deliberately unused;
do not add pagination behavior. Public max-age 300/stale 60 and private errors remain unchanged.
Original basic query tests pass before extraction. Move the two aggregate orchestration tests to
the owned service suite with real query/mapping coverage; retain wrapper tests for surviving adapters.
Final C/D acceptance is one full verification run, not a claim that Market is complete.

### Checkpoint C — transfer history and detail APIs

Base `e3dad14b`; same campaign branch/worktree and single coordinator. Allowed edits are the
three transfer/detail query functions and their obsolete types in the legacy Market query module;
new Market query/record/model/mapper/service/validation contracts; GET `/api/market/transfers`,
`/api/market/stats/value-details` and `/api/market/duels/details`; their tests, policy registration
and campaign documentation. Keep the global service wrappers as forwarding compatibility adapters
until the remaining Market consumers move. No UI or private operation changes.

Each reviewed call chain reaches only the configured-season resolver and PostgreSQL SELECTs over
historical transfers/bids, players/season facts, manager display identities, matches and teams.
No session fallback, provider call, command or credential record participates. HTTP numeric inputs
are validated; buyer/seller patterns remain bound SQL values (including existing wildcard semantics).
Threat cases: injected filter text must remain a parameter; extra record fields must not escape
the mapper; cookies must not affect these public historical projections. Preserve pagination limits
rather than adding throttling or changing access policy in a structural refactor.

Preserve the 10-row HTTP/20-row internal defaults, all/Todos filter sentinels, trim behavior,
missing-ID default zero, prefix parsing, duel-ID truncation, snake_case/null fields, date JSON,
ordering, count failures, exact status/envelopes, force-dynamic detail declarations and 60/300-second
success caches. Original query characterization passes six cases before edits. Add complete mapper,
service, validation, real-handler and graph tests; compare SQL templates and bound arguments against
the original. Stop for any required external contract/security change. Final full verification is
required; these three reads do not finish the remaining Market analytics/screens.

### Checkpoint B — trends read boundary

Pinned predecessor: `deda942d`. The same coordinator owns this sequential checkpoint.
Allowed edits: the Market trend query/function and model in the legacy Market module, new Market
models/query/mapper/service/validation/server contract files, GET `/api/market/trends`, its tests,
architecture entrypoint registration and this receipt/assignment. Keep the existing global service
wrapper for the 30-day Market aggregate/section and 14-day Assistant callers; it must forward to
the new single implementation. Do not edit Assistant or UI code.

The complete trend call chain is the handler or numeric internal caller, global wrapper where
retained, `getMarketTrendsAnalysis`, season resolver and one SELECT over fichajes/players. It uses
no session, cookie, provider call or write. Selected facts are date, aggregate prices/counts and
player name/transfer price; preserve nulls and integer truncation. Keep the original SQL and ordering.
HTTP parsing retains default 30, parseInt quirks and allowed 7/30/90/180/365; internal 14 remains valid.
Public success max-age 60/stale 60 and private error headers remain unchanged; no server cache added.

Before extraction, a six-case original listing/trend suite passes, including a 14-day nullable-data
projection. Add mapper, service, validation and real-handler contract tests, client/server boundary
assertions and SQL argument evidence. Run focused tests, typecheck, architecture and full acceptance.
Stop if an external contract/policy change is needed; completing trends alone does not complete C05.

Complete the [receipt's route/helper inventory](../reports/c05-market-reads.md) for `/market`, its
transfers/trends/bids/investments sections and the six existing read APIs before changing those flows.
Own queries, allowlisting mappers, typed models, bounded services and screens; reuse Teams/Players
contracts without barrel cycles. Retire old implementations only after all consumers are traced.
Pin the next exact write set before broader extraction. Keep Dashboard and Assistant adapters until
their assigned campaign packages; do not mix their functionality into Market ownership.

Private offers/accept/reject/remove/sell/sell-all, linking, credentials and provider mutations remain
frozen. A URL name is not evidence that a response is public. Finish transitive output/access review
before affirming existing public caching is safe. No production operations, push or deployment.

### Checkpoint F — Market listings and opportunities

Pinned predecessor: `51f84bf6`. Extract the two existing listing/opportunity SELECTs, typed
records, allowlisting mappers and bounded Market services. Services reuse Players/server form
and Teams/server competition contracts. Preserve three-round opportunity and five-round listing
windows, independent season reads, helper-before-listing query ordering, limits, ranking, nulls,
snake_case fields and existing errors/cache behavior. Keep legacy forwarding exports for the
Market aggregate, Dashboard and Assistant; do not change those features or provider commands.
The shared Player form implementation remains single-owned pending its other consumer closure;
do not introduce a Teams-to-Players barrel cycle or duplicate its SQL. Characterize original
opportunities before extraction and retain listing baselines. Verify SQL, projection safety,
ordering, service failures, cross-feature graph, full checks and document remaining screen work.

### Checkpoint G — Remaining Market analytics and activity

Predecessor: `feeca992`. The coordinator owns the remaining statistical SELECTs, explicit
record/model projections, bounded summary/auction/investment/activity services, duel calculation,
aggregate composition and GET `/api/market/stats`. Preserve all SQL, independent season reads,
numeric/nullable fields, sorting/ties, name-based directory enrichment, and Record Bid's existing
warning/empty fallback. The aggregate must reuse Managers directory through its server contract.
No provider commands, auth, schema, dependency or UI changes. No cache policy change.

These call chains read fantasy transfer/bid/player/team facts and manager display identities;
they do not resolve sessions or read account credentials. Keep the existing public HTTP response
and private generic errors, with explicit allowlists preventing extra record fields from leaking.
Pin original query-output fixtures before moving code. Check every selected field, including
fichajes wildcard columns, against the schema; do not trust incomplete legacy interfaces.
Run focused/golden/service/HTTP/boundary tests, SQL comparison and full acceptance. Market
screens and cross-campaign adapter cleanup remain separate outstanding work.

Final acceptance follows the [completion plan](../completion-plan.md), [worker protocol](../worker-protocol.md)
and [review checklist](../reviewer-checklist.md). Record logical commit SHAs and all validation results.
