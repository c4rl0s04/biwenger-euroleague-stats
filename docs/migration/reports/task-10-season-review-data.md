---
title: Task 10 Season Review data
description: Season Review data architecture ownership, compatibility decisions and acceptance evidence.
audience:
  - maintainer
  - agent
status: active
---

# Task 10 — Season Review data

Base: `fd4249567c9c0bc931327178a5dd5265ebfeae44`.
Branch: `refactor/season-review-data`.
Worktree: `../biwengerstats-next-season-review-data`.
State: Verified locally.

## Scope and flow

The Season Review data layer (calculation engines, raw queries, artifact loaders, and scenario simulation services) is now owned by `src/features/season-review/`.
This task isolates and migrates:

1. Pure calculation engines: Gini indices, economic ledger snapshots, roster cap diagnostics, Monte Carlo simulation agents, and paired configuration ranking.
2. Raw analytical queries: Historical 2025/26 season SQL querying `user_seasons`, `user_rounds`, `lineups`, `player_round_stats`, `finances`, `initial_squads`, `fichajes`, `market_values`, `market_listings`, and `transfer_bids`.
3. Cached service orchestration: Cached overview generation (`CACHE_TTL.VERY_LONG`), artifact parsing for `season-simulation-analysis.json`, and dynamic counterfactual scenario simulation (`simulateSeasonResilience`).
4. Page and server action contracts: Server actions (`runSeasonReviewScenario`) and Server Component pages (`/season-review` and `/season-review/[section]`) consume `@/features/season-review/server`.

UI presentation components (`SeasonReviewClient.tsx`, mobile screen sections) remain in place for **Task 11**. Offline simulation CLI generation scripts (`scripts/analysis/*`) remain mapped to **Task 21**. Product PR #29 remains entirely separate.

## Contracts and caching preserved

- **Access and freshness:** Overview and scenario simulations use `CACHE_TTL.VERY_LONG` (86,400s) with identical cache keys (`season-review:resilience-overview:2025-26:v3` and `season-review:resilience-simulation:v3:...`).
- **Server actions:** `runSeasonReviewScenario` enforces `auth()` authentication, validates requests using `resilienceRequestSchema`, and returns `{ success: true, data }` or `{ success: false, error: 'No se pudo calcular el escenario' }` without leaking internal errors.
- **Pure engines:** Exact mathematical models, agent behaviors, random seed generators, and statistical calibration formulas are preserved line-by-line.
- **Client safety:** `public.ts` exports only serializable types and pure UI chart formatters (`buildEvolutionChartModel`, `buildEvolutionMilestones`). All server-only logic, queries, and file-reading services are strictly isolated in `server.ts` protected by `import 'server-only'`.

## Backward compatibility shims

Temporary compatibility re-exports ensure zero disruption to offline analysis scripts (`scripts/analysis/`) and existing UI components:

- `src/lib/season-review/types.ts` -> `@/features/season-review/public`
- `src/lib/season-review/simulation-types.ts` -> `@/features/season-review/public`
- `src/lib/season-review/evolution-chart.ts` -> `@/features/season-review/public`
- `src/lib/season-review/resilience.ts` -> `@/features/season-review/server`
- `src/lib/season-review/simulation-dataset.ts` -> `@/features/season-review/server`
- `src/lib/season-review/season-simulator.ts` -> `@/features/season-review/server`
- `src/lib/season-review/simulation-analysis.ts` -> `@/features/season-review/server`
- `src/lib/season-review/read-analysis.ts` -> `@/features/season-review/server`
- `src/lib/services/features/seasonResilienceService.ts` -> `@/features/season-review/server`
- `src/lib/db/queries/analytics/season-review.ts` -> `@/features/season-review/server`

## Verification evidence

1. **Focused Season Review test suites (10 test files, 36 tests):**
   - Pure engines: `resilience.test.ts` (8 tests), `season-simulator.test.ts` (6 tests), `simulation-analysis.test.ts` (5 tests), `simulation-dataset.test.ts` (2 tests), `evolution-chart.test.ts` (2 tests).
   - Raw query: `season-review-raw.query.test.ts` (1 test).
   - Services: `season-review.service.test.ts` (4 tests), `scenario-simulation.service.test.ts` (2 tests).
   - Server action: `actions.test.ts` (3 tests).
   - Architectural boundary: `boundary.test.ts` (3 tests) validating strict separation between `public.ts` and `server.ts`.
2. **Whole Repository Verification (`npm run verify`):**
   - `skills:check`: Passed
   - `architecture:check`: Passed (1,017 modules, 86 protected entrypoints)
   - `docs:check`: Passed
   - `typecheck`: Passed (`tsc --noEmit` with zero errors)
   - `test:run`: Passed (all 2,526 unit and contract tests passed)
   - `lint`: Passed (zero errors, existing 24 image warnings)
   - `build`: Next.js 16.3.4 (Turbopack) production build passed (52 static/dynamic routes compiled)
   - `db:audit:schema:metadata`: Passed (37 tables, zero schema drift)
   - `drizzle-kit check`: Passed
   - `git diff --check`: Passed cleanly
