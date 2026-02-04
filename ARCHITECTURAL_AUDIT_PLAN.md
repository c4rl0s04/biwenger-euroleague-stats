# IMPERATIVE ARCHITECTURAL AUDIT PLAN

This document outlines the strict validation and refactoring process required to stabilize the BiwengerStats-Next architecture. We are adopting a **strict Service-Layered Architecture**.

## A. Architecture & Flow Validation

The following table maps our key features to their architectural components. **Critical Violations** indicate where the Service Layer is bypassed or missing.

| Feature         | Frontend Entry Point        | Service Layer (`src/lib/services`) | Data Access (`src/lib/db/queries`) | Status                 | Notes                                                                                |
| :-------------- | :-------------------------- | :--------------------------------- | :--------------------------------- | :--------------------- | :----------------------------------------------------------------------------------- |
| **Dashboard**   | `src/app/(app)/dashboard`   | `dashboardService.js`              | various                            | **Likely OK**          | Needs verification that `page.js` calls Service only.                                |
| **Market**      | `src/app/(app)/market`      | `marketService.js`                 | `market.js`                        | **Likely OK**          | Verify Service does not leak SQL types.                                              |
| **Compare**     | `src/app/(app)/compare`     | `compareService.js`                | `players.js`, `stats.js`           | **Likely OK**          | Recent work here suggests it follows the pattern.                                    |
| **Players**     | `src/app/(app)/players`     | `playerService.js`                 | `players.js`                       | **Likely OK**          | Check for direct query usage in filters.                                             |
| **Rounds**      | `src/app/(app)/rounds`      | `roundsService.js`                 | `rounds.js`                        | **Likely OK**          | Ensure massive `rounds.js` query file is abstracted by Service.                      |
| **Standings**   | `src/app/(app)/standings`   | `standingsService.js`              | `standings.js`                     | **CRITICAL VIOLATION** | **Major Issue:** Business logic (tie-breaking) is in `lib/utils` instead of Service. |
| **Matches**     | `src/app/(app)/matches`     | **MISSING**                        | `matches.js`                       | **CRITICAL VIOLATION** | No `matchesService.js` found. Frontend likely calls DB/API directly.                 |
| **Schedule**    | `src/app/(app)/schedule`    | **MISSING**                        | `schedule.js`                      | **CRITICAL VIOLATION** | No `scheduleService.js` found.                                                       |
| **Team**        | `src/app/(app)/team`        | `teamService.js`                   | `teams.js`, `users.js`             | **Needs Review**       | Service file is very small (325 bytes), might be insufficient.                       |
| **Predictions** | `src/app/(app)/predictions` | `predictionsService.js`            | `predictions.js`                   | **Needs Review**       | Small service file.                                                                  |

## B. Utils & Helper Consolidation

We must clean up the scattered utilities. Business logic found here **MUST** be moved to the Service Layer.

- **`src/lib/utils/standings.js` (18KB):** **FLAGGED.** Contains complex tie-breaking and goal average logic. This is **Pure Business Logic** and belongs in `standingsService.js` or a dedicated `lib/logic/standingsRules.js` called ONLY by the service. It should NOT be in `utils`.
- **`src/lib/utils/match-scores.js`:** **FLAGGED.** Domain logic regarding score parsing. Should be with Standings/Matches service logic.
- **`src/utils/fantasy-scoring.js`:** **ORPHANED.** This file lives in `src/utils` while all others are in `src/lib/utils`. It must be moved to `src/lib` (either `services` or `constants`) to unify the project structure.
- **`src/lib/utils/api-wrapper.js`:** **Review.** Ensure this isn't concealing direct DB calls.
- **`src/lib/db/sql_utils.js`:** **Keep.** Valid infrastructure helper.

## C. Onboarding Clarity Check

- **Ambiguous Directory:** `src/utils` vs `src/lib/utils`. **Action:** Delete `src/utils` and move contents to `src/lib`.
- **Query File Bloat:** `rounds.js` in `db/queries` is 36KB. It likely contains mixed responsibilities. **Action:** Audit for "Service" logic leaking into "Data" layer.
- **Documentation:** Missing JSDoc on Service methods makes it hard to know what the frontend expects. **Action:** Enforce JSDoc for all `export` functions in `src/lib/services`.

## D. The Action Plan

Follow this checklist to execute the stabilization phase.

### Phase 1: Structure & Utils Cleanup

1.  [x] **Move Orphaned Utils:** Move `src/utils/fantasy-scoring.js` to `src/lib/services/scoring/` or `src/lib/business/`. Delete `src/utils`.
2.  [x] **Refactor Standings Logic:** Extract the business logic from `src/lib/utils/standings.js` and integrate it effectively into `standingsService.js`. The "Util" should be pure formatting/math, not rule implementation.
3.  [x] **Consolidate Match Logic:** Move `match-scores.js` logic closer to the `matchesService` (to be created).

### Phase 2: Missing Service Implementation

4.  [x] **Create `matchesService.js`:** Encapsulate `src/lib/db/queries/matches.js`. Refactor `src/app/(app)/matches` to use this service.
5.  [x] **Create `scheduleService.js`:** Encapsulate `src/lib/db/queries/schedule.js`. Refactor `src/app/(app)/schedule` to use this service.
6.  [x] **Audit `teamService.js`:** Determine if it's too thin and if `src/app/(app)/team` is bypassing it for complex data.

### Phase 3: Strict Layer Enforcement

7.  [x] **API Route Audit & Standardization:**
    - Refactor all API routes to use `withApiHandler` from `src/lib/utils/api-wrapper.js`.
    - **Reject** any file importing from `src/lib/db` directly. They MUST import from `src/lib/services`.
8.  [x] **Frontend Audit:** Check every `page.js`. **Reject** any file importing from `@/lib/db`. They must use Server Actions or API routes backed by Services.

### Phase 4: Documentation

9.  [x] **Add JSDoc:** Add input/output documentation to every public method in `src/lib/services`.
