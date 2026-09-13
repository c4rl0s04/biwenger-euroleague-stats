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
