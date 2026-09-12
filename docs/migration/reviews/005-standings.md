---
title: Standings checkpoint B accepted and checkpoint C assignment
description: Independent analytics acceptance and narrowly scoped restoration of service cache behavior.
audience:
  - agent
  - maintainer
status: active
---

# Checkpoint B accepted; full batch remains CHANGES_REQUESTED

Reviewed candidate: `09f42eebdf674c96997b5c250c7b9015b7eabf11`.
Cumulative checkpoint base: `0c28966718899b535f1200b8e8482e06cf53f8ea`.
See [previous corrections](004-standings.md) and [remaining batch findings](002-standings.md).

## Standards

No new blocking findings in this correction. The analytics mapper now uses a typed,
seven-field allowlist and preserves source values, including nullable names and empty icons.
The array model matches the service; duplicate query declarations are consolidated and
the three unrelated interfaces are restored. The inferred service return is accurate;
its missing explicit annotation is not a checkpoint blocker.

## Spec

No new blocking findings. The original analytics array envelope and field names are
preserved. Tests exercise the real handler/service/mapper/query chain with the database
mocked, including null and empty values, IDs, numeric values, headers and errors.
The checkpoint scratch script is removed. Two independent reviewers found no new blockers.

## Independent validation

- `npm run typecheck`: PASS.
- `npm run architecture:check`: PASS, 792 modules / 44 protected entrypoints.
- `npm run test:run -- src/features/standings src/app/api/standings --maxWorkers=2`:
  PASS, 113 tests across 14 files.
- `git diff --check 0c289667..HEAD`: PASS at the reviewed candidate.
- Worker worktree: clean.
- Full suite, lint, build, schema checks and browser verification were not rerun for this
  bounded checkpoint. Checkpoint A had a passing build; full-batch acceptance remains pending.

The report still contains a commit placeholder. Replace it with the actual B source SHA
in the next report update; this alone does not require another B correction round.

## Worker assignment — checkpoint C only

Resume `refactor/standings-read-completion` in
`/Users/carlosandreshuete/Documents/Projects/biwengerstats-next-standings-read-completion`.
Confirm clean status and HEAD `09f42eebdf674c96997b5c250c7b9015b7eabf11` before editing.
If HEAD differs, report it before proceeding. Read applicable AGENTS.md and the worker
protocol. Do not rebase, create another branch, merge, push or deploy.

### Objective and exact scope

Remove only the React request-memoization wrappers introduced by this migration.
Preserve every existing function body, query call order, mapper, sort and error behavior.
Use ordinary exported async functions or async arrow functions, without a replacement cache.

Allowed production files under `src/features/standings/server/services/`:

- `performance.service.ts`: fetchVolatilityStats, fetchHeatCheckStats, fetchHunterStats,
  fetchRollingAverageStats, fetchFloorCeilingStats, fetchPointDistributionStats,
  fetchDominanceStats, fetchPositionChangesStats and fetchReliabilityStats.
- `theoretical.service.ts`: fetchTheoreticalGapStats, fetchLeagueComparisonStats,
  fetchRivalryMatrixStats, fetchHeatmapStats and fetchTheoreticalStandings.
- `draft.service.ts`: fetchInitialSquadStats only. Leave accepted fetchInitialSquadAnalytics unchanged.

Remove the now-unused React cache imports in these three files. Do not remove or change
the pre-existing shared `cached` helper, advanced-query caches or all-play-all caching.
Cache keys, TTLs, HTTP headers, route dynamic/revalidation declarations and access policies
must remain unchanged. This restores the previous policy; it is not a caching redesign.

### Tests and validation

Add a focused source/architecture contract test under the Standings feature verifying all
15 named exports remain ordinary async functions with no React cache import or wrapper.
Prefer a TypeScript AST assertion over a fragile text match. Merely calling a service twice
outside a React render is insufficient to detect request memoization. Keep all existing tests.

Run and record baseline and post-change results for:

- `npm run typecheck`
- `npm run architecture:check`
- `npm run test:run -- src/features/standings src/app/api/standings --maxWorkers=2`
- `git diff --check 09f42eeb..HEAD` after committing, plus `git diff --check` before committing.

The focused suite must include the existing all-play-all cache contract and accepted analytics
tests. No production database operations. Full acceptance checks remain deferred to the
coordinator; this limited assignment does not claim full-batch readiness.

### Handoff and stop

Commit only the three scoped service files, focused tests and worker report using explicit
paths, not `git add .`. No scratch scripts. Update `docs/migration/reports/001-standings.md`
with exact commands/results and actual source SHAs; replace the B placeholder with `09f42eeb`.
Mark "CHECKPOINT C — awaiting review; full batch incomplete". Leave the worktree clean and stop.

Do not change models, mappers, SQL, manager selection, UI, other features, dependencies,
schema, credentials or configuration in this checkpoint. Do not fix other open findings yet.

## Still pending after this assignment

Seven-part draft payload compatibility; performance/theoretical models and mappings;
theoretical manager-directory selection; typed screen composition and broader contracts;
out-of-scope helper ownership and earlier scratch/whitespace cleanup; full validation and
desktop/mobile verification. Checkpoints A and B are accepted, not the complete Standings migration.
