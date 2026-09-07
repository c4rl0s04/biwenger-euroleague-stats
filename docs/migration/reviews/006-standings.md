---
title: Standings checkpoint C accepted and checkpoint D assignment
description: Restore seven-part initial-squad payload compatibility without expanding the migration scope.
audience:
  - agent
  - maintainer
status: active
---

# Checkpoint C accepted; checkpoint D ready

C candidate: `fb26a5ade52d4f54574877bbe30576a8e22000ea`.
Independent typecheck, architecture (792 modules / 44 protected entrypoints), focused
Standings/API suite (116 tests / 15 files), and `git diff --check 09f42eeb..HEAD` passed.
Worker worktree was clean. No production implementation blockers were found by either
standards or spec review. Full suite/build/browser/schema validation was not rerun for C.
See [C assignment](005-standings.md) and [remaining batch findings](002-standings.md).
The complete Standings batch remains CHANGES_REQUESTED, not integration-ready.

## Starting point and authority

Resume branch `refactor/standings-read-completion` in
`/Users/carlosandreshuete/Documents/Projects/biwengerstats-next-standings-read-completion`.
Confirm clean status and HEAD `fb26a5ade52d4f54574877bbe30576a8e22000ea`; stop on a mismatch.
Read applicable AGENTS.md, feature-migration instructions and
[worker protocol](../worker-protocol.md). This assignment supersedes earlier stop-at-C wording.
Do not create another worktree, rebase, amend C, merge, push or deploy.

Behavior reference is `38bf2de48fc1c73165389536ef7ecbed2307ebad`, not the broken current mappers.
Read its `src/lib/services/app/standingsService.ts` function fetchInitialSquadStats,
the seven original query implementations (follow their exports from src/lib/db), the original
`src/app/api/standings/initial-squad-stats/route.ts`, and response helpers using `git show`.
Do not check out or overwrite files with historical versions.

## D objective

Restore the original seven-part initial-squad read contract through typed, allowlisted
view models. Preserve every selected field, null, empty string, ID representation, numeric
value and array order. This is a compatibility correction, not a normalization redesign.

The current service already has the seven envelope keys and parallel query orchestration.
The current models/mappers omit two detailed fields and introduce coercions/defaults.
Do not invent different field names or change formulas to fit a model.

| Envelope key      | Query                            | Exact item fields                                                                                                                                                                                  |
| ----------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bestDraftPerUser  | getBestInitialSquadPlayer        | user_id, user_name, user_color_index, icon, player_name, player_id, total_fantasy_points                                                                                                           |
| retainedRanking   | getInitialSquadRetainedPoints    | user_id, user_name, user_color_index, icon, players_contributed, total_points                                                                                                                      |
| retainedBreakdown | getInitialSquadRetainedBreakdown | user_id, user_name, icon, player_name, points                                                                                                                                                      |
| regretRanking     | getInitialSquadRegret            | user_id, user_name, user_color_index, icon, points_lost, top_regret_player                                                                                                                         |
| loyaltyRanking    | getInitialSquadLoyalty           | user_id, user_name, user_color_index, icon, retained_count, initial_count, loyalty_percentage                                                                                                      |
| potentialRanking  | getInitialSquadPotentialAdvanced | user_id, user_name, user_color_index, icon, total_points, total_value                                                                                                                              |
| detailedSquads    | getInitialSquadsDetailed         | user_id, manager_name, manager_color_index, player_id, player_name, current_points, current_price, player_position, current_owner_id, current_owner, current_owner_color_index, points_contributed |

Verify types against original SELECT projections, existing post-query conversions and
schema declarations, not just legacy interfaces (some incorrectly exclude null).
Preserve SQL COALESCE results; do not replace nullable values where SQL leaves them nullable.
Keep original parseInt/parseFloat and fallback behavior in the query layer unchanged.
Mappers receive these already-converted results and explicitly copy only the listed fields.
No `any`, `Record<string, any>`, blind casts, row spreads or newly added String/Number/default
coercions at the mapper/model/service boundary. Public models must not import query types.
Use accurate query result types as mapper inputs; use type-only imports where appropriate.
Do not use a fake union type solely to make a fabricated fixture compile.

In particular restore current_owner_color_index and points_contributed; preserve nullable
names/positions/owners as applicable, empty icons, leading-zero and nonnumeric text IDs.
Do not substitute manager_id/user_name aliases in detailed rows. The original service's
`detailedSquads || []` fallback must remain represented and tested separately, without
adding new fallbacks to the other six collections. Keep Promise.all order and rejection behavior.
Give fetchInitialSquadStats an explicit Promise<DraftStatsBundleViewModel> return contract.

## HTTP and consumers — inspect, do not rewrite

GET /api/standings/initial-squad-stats remains a public league-statistical read with no
session identity resolution. Success is status 200, `{ success: true, data: <seven keys> }`,
`Cache-Control: public, max-age=300, stale-while-revalidate=60`. Failure remains status 500,
`{ success: false, error: 'Internal Server Error' }` with
`private, no-store, max-age=0, must-revalidate`. Preserve `dynamic = 'force-dynamic'`.
No new cache wrapper, endpoint, input validation, auth rule or error logging behavior.

Trace all consumers with rg, including initial-squad cards and desktop/mobile composition.
Existing consumers must receive the original fields without UI edits. If a genuine external
contract conflict requires changing a consumer, stop and report it instead of expanding scope.

## Allowed writes

- `src/features/standings/models/draft.ts`: seven bundle item models and bundle only.
- `src/features/standings/server/mappers/draft.mapper.ts`: seven bundle mappers only.
- `src/features/standings/server/queries/draft.query.ts`: type declarations/annotations for
  the seven queries only when needed to describe actual output accurately. No SQL or runtime
  expression changes; no unrelated interface edits or file-wide formatting.
- `src/features/standings/server/services/draft.service.ts`: fetchInitialSquadStats only.
- New focused draft bundle mapper/service/HTTP tests under src/features/standings/server.
- `src/features/standings/server/services/service-cache.contract.test.ts`: C follow-up below.
- `docs/migration/reports/001-standings.md`: worker evidence only.

Keep accepted mapDraftPerformance, analytics models/service and analytics tests unchanged.
Do not edit pages, routes, components, exports, shared helpers, graph policy, dependencies,
schema/migrations, credentials, production configuration or another feature. No scratch scripts.

## Required tests — original behavior is the oracle

Write failing regression cases before the correction, record their failures, then fix code.
Do not copy the migrated mapper output into expected fixtures or update tests to accept regressions.

1. Typed mapper cases for all seven collections: exact keys, valid populated/nullable/empty
   values, preserved text IDs, zero/negative/decimal scores, and both restored detailed fields.
   Use synthetic extra properties to prove allowlisting without real secrets or unsafe type casts.
2. HTTP contract through the actual handler -> service -> mappers -> query implementations,
   mocking only persistence and season infrastructure as needed. Follow the accepted analytics
   test pattern. Assert all seven populated arrays and exact JSON values/headers/status, all-empty
   arrays, mixed empty/populated collections, and preserved ordering (include at least two rows).
   Fixtures at the DB seam must reflect raw driver values; expectations reflect original query
   conversions, not additional mapper normalization. Do not mock the service for these cases.
3. Failure of each query must reject the service and produce the unchanged 500 HTTP contract;
   use synthetic errors and silence/assert logging locally without changing production logging.
   A separate service-level seam may test detailedSquads' legacy null/undefined fallback.
4. Verify unchanged SQL and bound-parameter expressions for the seven functions against the
   original implementation and record evidence; no live database is needed.
5. C test follow-up: assert AsyncKeyword on every checked function, recognize aliased cache
   imports by imported name, and remove the redundant call-expression branch after the
   function-kind assertion. Include negative synthetic source cases so these guards demonstrably
   fail for a non-async function, a wrapped export, and an aliased React cache import.

## Validation and handoff

Record baseline typecheck, graph and focused suite before edits. After implementation run:

```bash
npm run typecheck
npm run architecture:check
npm run test:run -- src/features/standings src/app/api/standings --maxWorkers=2
npm run db:audit:schema:metadata
npx --no-install drizzle-kit check
git diff --check
```

Schema commands are metadata-only: do not connect to a database or apply migrations.
Keep new/edited lines formatted without broad query-file rewrites. Full suite/lint/build/browser
acceptance is deferred to the coordinator and must be reported as not run for this checkpoint.
No skipped check may be described as passing. Stop and report unrelated failures rather than fixing them.

Commit source/tests with explicit paths; then capture its actual SHA. Make a separate documentation
commit recording that source SHA and exact baseline/post-change commands/results. Do not amend a
commit to embed its own SHA: that changes the SHA again. Correct C's report SHA to `fb26a5ad`
and cite the coordinator's C validation above without claiming you ran missing historical checks.
After commits run `git diff --check fb26a5ad..HEAD` and `git status --short`; report results.
Mark "CHECKPOINT D — awaiting review; full batch incomplete", leave clean and stop.

No later checkpoint is authorized. Performance/theoretical contracts, manager selection,
screen typing, older cleanup and full visual/acceptance verification remain separate work.
