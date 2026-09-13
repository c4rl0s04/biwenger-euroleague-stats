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

Final acceptance follows the [completion plan](../completion-plan.md), [worker protocol](../worker-protocol.md)
and [review checklist](../reviewer-checklist.md). Record logical commit SHAs and all validation results.
