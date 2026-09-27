---
title: Task 21 — Other Actions & Offline Analysis CLI Receipt
description: Authoritative implementation receipt for command/mutation inventory closure, offline simulation CLI migration, challenge generation scripts, and verification.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 21: Other Actions & Offline Analysis CLI Receipt

**Task status:** Implemented & Verified  
**Date:** 2026-09-27  
**Branch:** `refactor/other-actions`

---

## 1. Summary of Changes

Task 21 represents the formal closure of all remaining mutations, data generation routines, server actions, and offline simulation CLI scripts across the Biwenger Stats repository:

1. **Authoritative Command & Mutation Inventory Closure:**
   An exhaustive repository-wide audit cataloged every write operation, assigning each to an owning feature domain or formally justifying it as infrastructure:
   - **Market mutations** (`sell`, `sell-all`, `remove`, `offers/accept`, `offers/reject`): canonically owned by `src/features/market/commands/server/services/market-command.service.ts` (Task 17).
   - **Lineup mutation** (`POST /api/users/lineup`): canonically owned by `src/features/lineup/server/services/lineup-command.service.ts` (Task 15).
   - **Account mutations** (`link-biwenger`, `change-password`): canonically owned by `src/features/accounts/server/services/account-command.service.ts` (Task 18).
   - **Hoopgrid guess mutation** (`POST /api/hoopgrid/guess`): canonically owned by `src/features/hoopgrid/server/services/hoopgrid-command.service.ts` (Task 19).
   - **Assistant conversation mutations** (`sendMessage`, `createConversation`, `deleteConversation`): canonically owned by `src/features/assistant/server/services/assistant-command.service.ts` (Task 20).
   - **Server Action** (`runSeasonReviewScenario` in `src/app/(app)/season-review/actions.ts`): session-gated, delegates directly to `@/features/season-review/server`.
   - **Operational Infrastructure Writes** (`src/lib/sync/*`, `scripts/euroleague/*`, `scripts/db/*`, `scripts/dev/biwenger-credential-maintenance.ts`): scoped to ingestion, schema migrations, and credential rotation under Task 22.

2. **Offline Analysis & Simulation Scripts Migration (`scripts/analysis/`):**
   Migrated all 5 simulation and analysis CLI scripts from legacy deep-relative paths to feature-owned contracts:
   - `scripts/analysis/run-season-simulations.ts`: consumes `@/lib/db`, `@/features/season-review/server` (`getSeasonReviewRawData`, `buildSeasonSimulationDataset`, `runSeasonMonteCarlo`), and `@/features/season-review/public` (`SeasonSimulationArtifact`, `SeasonSimulationArtifactEntry`, `ResilienceConfig`, `ShockConfig`).
   - `scripts/analysis/run-season-analysis.ts`: consumes `@/lib/db`, `@/features/season-review/server` (`getSeasonReviewRawData`, `aggregateConfigurationSamples`, `generateConfigurationGrid`, `generateSeedManifest`, `simulatePairedSeason`, `summarizePairedSeason`, `buildSeasonSimulationDataset`), and `@/features/season-review/public` (`SimulationAnalysisArtifact`, `SimulationAnalysisShardArtifact`, `SimulationAnalysisStage`).
   - `scripts/analysis/calibrate-season-analysis.ts`: consumes `@/lib/db`, `@/features/season-review/server` (`calibrateSeasonSimulator`, `getSeasonResilienceOverview`), and `@/features/season-review/public` (`SimulationAnalysisArtifact`).
   - `scripts/analysis/merge-season-analysis.ts`: consumes `@/features/season-review/server` (`buildSimulationRanking`, `selectSimulationShortlist`) and `@/features/season-review/public` (`SimulationAnalysisArtifact`, `SimulationAnalysisShardArtifact`, `SimulationAnalysisStage`).
   - `scripts/analysis/merge-season-simulations.ts`: consumes `@/features/season-review/public` (`SeasonSimulationArtifact`, `SeasonSimulationArtifactEntry`).

3. **Hoopgrid Hard Challenge Generator Migration (`scripts/hoopgrid/`):**
   - `scripts/hoopgrid/generate-hard.ts`: updated dynamic imports to consume `hoopgridCommandService` directly from `@/features/hoopgrid/server` and `@/lib/db`.

4. **Package Script Runtime Environment Fix (`package.json`):**
   - Updated `"simulation:analysis:merge"` to execute with `NODE_OPTIONS=--conditions=react-server`, ensuring clean resolution of server-side simulation engines.

5. **Automated CLI Test Coverage:**
   - Created `scripts/analysis/__tests__/simulation-cli.test.ts` to test configuration grid generation, ranking, Pareto frontier detection, shortlist selection, calibration algorithms, and Hoopgrid complexity calculation without requiring expensive multi-minute Monte Carlo runs.

---

## 2. Architectural Boundaries & Operational Guarantees

- **Zero Web Runtime Impact:** Offline analysis batch scripts generate static JSON artifacts into `artifacts/` or `src/data/` and have no direct web runtime exposure or dynamic database write effects during normal application requests.
- **Strict Separation of Concerns:** Simulation algorithms and mathematical ranking models reside within the feature engine boundary (`src/features/season-review/server/engines/`).
- **Idempotency & Reproducibility:** Simulation generation runs rely on deterministic stratified seed manifests (`generateSeedManifest`) and configuration grids (`generateConfigurationGrid`).
- **Complete Command Closure:** Every mutation in the application is strictly accounted for, validated via Zod schemas, session-authenticated, and encapsulated in a dedicated feature command service.

---

## 3. Verification Evidence

- **Focused CLI & Action Tests:**
  - `scripts/analysis/__tests__/simulation-cli.test.ts`: 5 passed (5/5 tests).
  - `src/app/(app)/season-review/actions.test.ts`: 3 passed (3/3 tests).
- **Server Guards:** `src/tests/architecture/server-guards.test.ts`: 144 passed (144/144 tests).
- **Architecture Integrity:** `npm run architecture:check`: passed (1,097 modules, 99 protected entrypoints, 0 violations).
- **Type Safety:** `npm run typecheck`: passed with 0 errors.
- **ESLint:** `npm run lint`: passed with 0 errors.
- **Documentation Vault:** `npm run docs:check`: passed for 121 vault notes.
- **Database Schema Audit:** `npx drizzle-kit check` and `npm run db:audit:schema:metadata`: passed (37 tables, 0 drift).
- **Production Build:** `npm run build`: compiled successfully (52/52 static pages generated).
