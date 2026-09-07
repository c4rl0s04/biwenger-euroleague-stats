---
title: Batch 001 — Standings read completion
description: Runnable single-worker pilot for the complete Standings historical read experience.
audience:
  - agent
  - maintainer
status: active
---

# Batch 001 — Standings read completion

**Dispatch: READY, one worker only.** Read [worker protocol](../worker-protocol.md).
This assignment authorizes local implementation, not integration or release.
Do not start another batch or spawn additional workers.

## Locked starting point

- Required application base: `5be73a8eb1edd18b1e7ced259488e0da51f3e3d7`.
- Instruction branch: `docs/migration-worker-playbook`.
- Worker branch: `refactor/standings-read-completion`.
- Sibling worktree: `../biwengerstats-next-standings-read-completion`.
- Worker report: [pilot report](../reports/001-standings.md) (fill the stub using the template).

The instruction branch carries unpublished Rounds and documentation. This is deliberate:
theoretical Standings already consumes Rounds history. Do not start from production main,
cherry-pick Rounds, or assume its local verification means it was deployed.

From the instruction checkout, verify the base is an ancestor of the instruction branch.
Inspect the changes above the required application base: they must be documentation only.
Resolve and record the instruction branch's full SHA, then create the worker worktree from
that exact resolved SHA. If these assertions fail, or the names already belong to another
task, stop. Resume an existing same-task branch only after reading its report/status.

Commands to inspect before creating anything:

```bash
git status --short
git worktree list
git rev-parse docs/migration-worker-playbook
git merge-base --is-ancestor 5be73a8eb1edd18b1e7ced259488e0da51f3e3d7 docs/migration-worker-playbook
git diff --name-only 5be73a8eb1edd18b1e7ced259488e0da51f3e3d7..docs/migration-worker-playbook
```

Use `git worktree add -b refactor/standings-read-completion ../biwengerstats-next-standings-read-completion <resolved-instruction-sha>`
only after those checks. Do not type the placeholder literally.

## Exact user-facing scope

Complete the existing Standings read experience, not just a query foundation:

- `/standings`: desktop browser-driven composition and phone server-rendered overview.
- `/standings/[section]`: progression, rounds, draft, form, performance, alternatives,
  curiosities, captains. Retain desktop hash redirects and invalid-section behavior
  from the unchanged mobile route registry.
- Every existing `GET /api/standings/*` listed below. No new endpoint or canonical rename.

| APIs (all under /api/standings/)                                                          | Scope                                                                   |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| full, league-totals, value-ranking                                                        | Already feature-owned; preserve and reuse                               |
| advanced                                                                                  | Finish all 13 existing dispatcher variants; reuse existing all-play-all |
| analytics, initial-squad-stats                                                            | Initial-squad analytics and seven-part bundle                           |
| bottlers, captains, efficiency, heartbreakers, jinx, league-comparison                    | Statistical read contracts                                              |
| no-glory, placements, points-progression, round-winners, streaks, theoretical, volatility | Statistical read contracts                                              |

There are 19 current route handlers. Reconcile this list with disk before editing.
An unexpected handler or ownership ambiguity requires a report, not automatic scope expansion.

## Read these source entry points

- [Base page](<../../../src/app/(app)/standings/page.js>) and
  [section page](<../../../src/app/(app)/standings/[section]/page.tsx>).
- [Existing feature](../../../src/features/standings) and
  [foundation decisions](../../architecture/standings-read-foundation.md).
- [Legacy service](../../../src/lib/services/app/standingsService.ts).
- [Competition queries](../../../src/lib/db/queries/competition/standings.ts).
- [Performance queries](../../../src/lib/db/queries/analytics/performance.ts),
  [advanced queries](../../../src/lib/db/queries/analytics/advanced_stats.ts), and
  [initial-squad queries](../../../src/lib/db/queries/analytics/initial_squads.ts).
- [Desktop components](../../../src/components/standings),
  [phone overview](../../../src/components/mobile/screens/MobileStandingsScreen.tsx),
  [mobile route registry](../../../src/lib/mobile/routes.ts) and
  [legacy row renderer](../../../src/components/mobile/MobileRecordList.tsx).
- [HTTP handlers and existing tests](../../../src/app/api/standings).

Follow imports through shared helpers and find every external consumer before moving/removing.
Do not infer contracts from TypeScript declarations alone; legacy aggregate typing can be wrong.

## Ownership and permitted changes

Own `src/features/standings/**`, the two Standings page adapters, the 19 handlers and
their focused tests, Standings-owned desktop/mobile components and the report.
Migrate only consumed Standings reads from the four legacy query modules above.
The legacy Standings service may become thin adapters; retain unrelated exports/consumers.
Narrow updates to legacy re-export barrels and external import paths are allowed only to
preserve an existing consumer after a move; no external composition/logic changes.

Other permitted changes: register these entrypoints in `scripts/architecture/policy.json`;
add focused tests and, if needed, a Standings-specific browser test file without running it.
No edits to checker implementation, existing exceptions, shared browser fixture/error guards,
snapshots, other batch files, queue, root instructions, shared DB/cache configuration or dependencies.
If new policy exceptions or shared contract changes beyond the following are needed, stop.

Deliberate dependencies:

- Reuse the existing Standings base and all-play-all services unchanged where possible.
- Theoretical standings calls `getUserPerformanceHistoryService` through Rounds `server.ts`.
  Do not duplicate Rounds scoring/history or deep-import it.
- For the existing active-manager directory read, use a Standings-owned query adapter over
  `src/lib/db/queries/core/manager-directory.ts`, without changing that shared SQL.
  Do not import Managers to solve this: Managers already depends on Standings.
- Keep Players/Teams/Matches consumed through deliberate public/server contracts.
- Preserve old query/service names for Dashboard, Compare, Assistant, shell and other consumers.
  Remaining leader-comparison/league-average helpers are outside this UI slice unless actually
  required by its existing call chain. Do not migrate Dashboard leader-gap or change its cache.
- Keep the existing contributor re-export in performance.ts and other non-Standings functions.
  The presence of legacy functions is not permission to delete an entire mixed module.

## Compatibility traps to preserve

1. Base page is force-dynamic. Desktop retains interactive browser reads and existing dynamic
   chart imports with `ssr: false`; phone overview retains its two parallel reads.
2. Section guard runs before reads. Progression uses 50, round winners 34; draft/form/performance
   retain their parallel bundles. Preserve first-array/first-20 row selection, nullish field
   precedence, Spanish formatting and captain links. Do not redesign or display extra fields.
3. Advanced supports exactly heat-check, hunter, rolling-avg, floor-ceiling, volatility,
   distribution, all-play-all, dominance, theoretical-gap, heatmap, position-evolution,
   reliability and rivalry-matrix. Its errors are bare `{ error }` with 400/500; success
   is `{ success: true, data }`, and no explicit HTTP Cache-Control is currently set.
   Do not standardize it through a helper that changes those contracts.
4. Progression's limit is `parseInt(value ?? '10', 10) || 10`; winners uses
   `value ? parseInt(value, 10) : 15`. Zero, negative, malformed, empty and repeated
   values differ. Preserve, don't replace with uniform strict validation.
5. Captains nests `{ stats }` inside the success data and calls the success helper with
   max-age 0 (this does not mean no-store). Retain each route's actual headers and
   dynamic/revalidation settings, including absent declarations and distinct error messages.
6. Base sorting has documented prototype-name quirks; keep the existing parser/model.
   No new session fallback. Public league statistics must remain distinct from private accounts.
   Stop and report any existing identity/cache safety conflict instead of silently changing it.
7. Existing advanced in-memory caches, including heatmap, position-changes and rivalry-matrix,
   retain their keys, season binding, TTL, cached value representation and caught-error behavior.
   All-play-all already has cross-adapter cache tests and a legacy NaN projection: reuse it.
   Don't add a second cache, cache mapped values differently or globally normalize NaN.
8. Preserve SQL filters, casts, join multiplicity, captain/bench multipliers, ties, rounding,
   population/sample formulas, participation rules, draft transfer ownership and snapshot timing.
   Preserve query order and partial-error fallbacks. No statistical corrections during extraction.
9. Theoretical standings retains per-manager history aggregation and descending ideal totals.
   Initial-squad stats retains its seven keys and only the existing detailedSquads fallback.
   Empty/null/omitted/string aggregate distinctions remain observable contracts.

These are source-backed starting points, not a substitute for tracing the full call chain.

## Implementation sequence

1. Write the inventory and baseline lightweight results in the report.
2. Separate query projections, pure calculations, mappers and services into bounded subareas:
   progression/results, performance/trends, draft, theoretical/comparison and screen composition.
   Names may differ when justified; do not create one enormous model/service.
3. Add explicit serializable public models and allowlisting mappers, preserving compatibility
   fields. Raw Drizzle records and `any`/loose Record models must not reach presentation.
4. Rewire real pages and handlers to shared services. Move domain screens/cards with their
   markup, styles, chart settings, loading/error/empty states and interaction logic unchanged.
   Existing global primitives and shell controls remain shared.
5. Turn legacy implementations into single-source adapters; remove only proven-unused files.
6. Register both pages and all fully migrated APIs with the graph checker. Keep client-safe
   exports in public.ts and guarded server exports in server.ts.
7. Write focused tests and run the protocol's lightweight checks. Commit source/tests in
   coherent steps and the worker report separately. Stop at READY_FOR_REVIEW.

## Tests to author; reviewer will execute full validation

- Query/formula characterization: ties, zero/negative/missing scores, null/numeric strings,
  participation, ordering, season scoping, captain/draft rules and cache hit/error paths.
- Model allowlists/serialization: nested fields, omitted/null values, non-finite values.
- Injectable service orchestration: success/empty/errors, same read sequence and fallbacks.
- Real HTTP handler -> service -> mapper contracts with only persistence/auth mocked:
  all 19 handlers and all advanced variants; edge-input differences; exact headers/status/envelopes.
- Page contracts: desktop/phone branch, guard-before-read, section bundles and original redirects.
- Cross-feature/legacy adapters: unchanged all-play-all caches, Rounds history integration,
  external callers, public/server separation and absence of new graph exceptions.

Worker minimum: baseline/final typecheck and architecture; working/full-range diff checks.
Full suite, lint/build, schema/Drizzle, source-to-source independent review and browser verification
are reviewer-owned under the [review checklist](../reviewer-checklist.md).
Do not capture candidate screenshots as the original baseline. Keep the base commit available.

## Stop conditions and finish line

Stop for unapproved API/security behavior changes, missing domain contracts requiring shared
changes, unexpected ancestry, foreign dirty worktrees or graph exceptions requiring a decision.
Report the exact issue and smallest options. Do not silently drop a hard subarea to declare success.

This pilot is finished only when the entire listed Standings read scope is implemented and
locally committed with an honest report. It is still awaiting independent verification.
Do not integrate, push, deploy, start Batch 002 or claim the whole architecture migration is complete.
