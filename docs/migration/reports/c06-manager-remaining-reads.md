---
title: C06 Managers Directory & Remaining Analytics migration
description: Source contracts, query reconciliation, frozen boundaries and verification evidence for the Managers remaining read slice.
audience:
  - contributor
  - agent
status: active
---

# C06 Managers Directory & Remaining Analytics migration

Baseline: `0253f53f624d2685507d7f7f3c0736f0c9ef5a22` on `main` (PR #38 merge).
Worktree: `/Users/carlosandreshuete/Documents/Projects/biwengerstats-next-managers-remaining-reads`
Branch: `integration/managers-remaining-reads-migration`
Status: IMPLEMENTED AND LOCALLY VERIFIED / AWAITING INDEPENDENT REVIEW.

## Executive summary

The C06 Managers Directory & Remaining Analytics migration establishes complete feature ownership for all remaining Managers-domain public and private read capabilities in `src/features/managers/`:

1. **Manager Directory**: `getManagerDirectory()` queries `readManagerDirectoryRows()` (delegating to the neutral shared projection `src/lib/db/queries/core/manager-directory.ts`), maps rows to `ManagerDirectoryViewModel`, and exports through `public.ts` and `server.ts`. `GET /api/users` delegates directly to this service with `public, max-age=900, stale-while-revalidate=60`.
2. **Manager Performance Analytics**: `getManagerCaptainStats(userId)` and `getManagerHomeAwayStats(userId)` query `readManagerCaptainStats(userId)` and `readManagerHomeAway(userId)`. `GET /api/dashboard/captain-stats` and `GET /api/dashboard/home-away` delegate to these services with `private, no-store, max-age=0, must-revalidate` and nested `{ success: true, data: { stats } }` envelopes.
3. **Manager Preparation Reads**: `getManagerCaptainRecommendations(userId, limit = 3)` and `getManagerPersonalizedAlerts(userId, limit = 5)` query `readCaptainCandidates(userId, seasonId)` and `readManagerAlertsRaw(userId, seasonId)`. Captain recommendations consume `getPlayerFormStats(3)` from `@/features/players/server`. Personalized Alerts provide manager-specific price-gain, price-loss and recent high-performance alerts. `GET /api/dashboard/captain-suggest` delegates directly with `limit = 6` and `private, no-store, max-age=0, must-revalidate`.
4. **Frozen Boundaries Preserved**:
   - Manager Profile (`src/features/managers/server/services/manager-profile.service.ts`, `/user/[id]`, etc.) was left untouched.
   - `getSquadStats()` in `src/lib/db/queries/core/users.ts` remains intact for deferred Lineup consumers.
   - Dashboard, Compare, Home, Assistant, and Schedule domain migrations are deferred; their existing caller sites were rewired to consume Managers server services directly or via thin forwarders.
   - Credentials, auth, and mutations remain untouched.
5. **Architecture Policy**:
   - Registered 4 entrypoints in `scripts/architecture/policy.json`: `src/app/api/users/route.ts`, `src/app/api/dashboard/captain-stats/route.ts`, `src/app/api/dashboard/home-away/route.ts`, and `src/app/api/dashboard/captain-suggest/route.ts`.
   - Recorded 18 auth session fallback persistence exceptions for the 3 dashboard routes reaching `getRequestUserId` -> `auth.js`.

## Preserved contracts, quirks, and exact semantics

- **Directory Contract**: Manager IDs remain string IDs; nullable name/icon and `color_index` are preserved. Public cache headers: `public, max-age=900, stale-while-revalidate=60`. Error response: `private, no-store, max-age=0, must-revalidate`.
- **Captain Stats Contract**: 4 sequential queries. Total rounds, extra points, and average points formatted with integer/float parsing. When database row contains NULLs, `parseInt(null) -> NaN` serializes to `null` in JSON. Most used captain defaults: `times_captain` integer, `avg_as_captain` float with 1 decimal. Best/worst captain round points integer.
- **Home/Away Stats Contract**: Sequential bind order `[seasonId, userId]`. Preserves missing-row behavior (`TypeError` when `rows[0]` is undefined). Rounding formulas: `Math.round(total_home / games_home)` and `Math.round(((total_home - total_away) / total_away) * 100)`.
- **Captain Recommendations**: Consumes `getPlayerFormStats(3)` from `@/features/players/server`. Thresholds: `>= 25` ('Excelente forma'), `>= 18` ('Buena forma'), `>= 12` ('Forma regular'), `< 12` ('Forma baja'), `null` ('Sin datos'). Filter: `avg_recent_points != null && avg_recent_points > 0`. Excludes `'X'`, `'?'`, and `''` when counting recent games. Default limit is `3` for service calls, while HTTP route explicitly passes `6`.
- **Personalized Alerts**: Manager-specific price-gain, price-loss and recent high-performance alerts. Preserves 3 sequential queries (`price_increment > 500000`, `price_increment < -500000`, `fantasy_points >= 25` on max round) with preserved ordering (gains → losses → good performance → slice(limit)). Price increments formatted in M€ with 2 decimals. Default limit is `5`.

## Verification evidence

- **Architecture Audit**: `npm run architecture:check` passed with 925 modules and 63 protected entrypoints (0 violations).
- **TypeScript Typecheck**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint` passed with 0 errors (24 pre-existing non-blocking next/image warnings).
- **Unit and Contract Tests**: `npm run test:run` passed across the entire suite (including characterization tests, mapper tests, contract tests, and route handler tests).
- **Production Build**: `npm run build` completed successfully with all static and dynamic routes validated.
