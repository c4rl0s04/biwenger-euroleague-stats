---
title: Batch 005 — Manager directory and remaining analytics
description: Migration assignment and verification evidence for manager directory, captain performance, home/away performance, captain recommendations, and personalized alerts.
audience:
  - agent
  - maintainer
status: active
---

# Batch 005 — Manager directory and remaining analytics

Authoritative base: `0253f53f624d2685507d7f7f3c0736f0c9ef5a22` (`origin/main`).
Branch: `integration/managers-remaining-reads-migration`.
Status: IMPLEMENTED AND LOCALLY VERIFIED / AWAITING INDEPENDENT REVIEW.

## Scope

Establish complete feature ownership for all remaining Managers-domain public and private read capabilities in `src/features/managers/`:

1. **Manager Directory**:
   - Service: `getManagerDirectory()`
   - Projection: Reuses neutral shared persistence projection `src/lib/db/queries/core/manager-directory.ts` via `readManagerDirectoryRows()`.
   - Route Handler: `GET /api/users` rewired to call `getManagerDirectory()` with `public, max-age=900, stale-while-revalidate=60`.
   - Forwarders: `src/lib/services/core/userService.ts` (`getAllUsers`) and `src/lib/db/queries/core/users.ts` (`getAllUsers`).

2. **Manager Performance Analytics**:
   - Services: `getManagerCaptainStats(userId)`, `getManagerHomeAwayStats(userId)`.
   - Queries: `readManagerCaptainStats(userId)`, `readManagerHomeAway(userId)` in `src/features/managers/server/queries/manager-performance.query.ts`.
   - Route Handlers: `GET /api/dashboard/captain-stats` and `GET /api/dashboard/home-away` rewired with `private, no-store, max-age=0, must-revalidate`.
   - Forwarders: `src/lib/services/app/dashboardService.ts` (`fetchCaptainStats`, `fetchHomeAwayStats`, `getUserDashboardData`) and `src/lib/db/queries/core/users.ts` (`getUserCaptainStats`, `getUserHomeAwayStats`).

3. **Manager Preparation Reads**:
   - Services: `getManagerCaptainRecommendations(userId, limit = 3)`, `getManagerPersonalizedAlerts(userId, limit = 5)`.
   - Dependencies: Consumes `getPlayerFormStats(3)` from `@/features/players/server`.
   - Queries: `readCaptainCandidates(userId, seasonId)`, `readManagerAlertsRaw(userId, seasonId)` in `src/features/managers/server/queries/manager-preparation.query.ts`.
   - Route Handler: `GET /api/dashboard/captain-suggest` rewired to `getManagerCaptainRecommendations(userId, 6)` with `private, no-store, max-age=0, must-revalidate`.
   - Forwarders & Consumers: `src/lib/services/app/dashboardService.ts` (`fetchCaptainRecommendations`, `getNextRoundData`, `getUserDashboardData`, `getRecentActivityData`), `src/lib/services/app/homeService.ts` (`getHomeSummary`), and `src/lib/db/queries/core/users.ts` (`getCaptainRecommendations`, `getPersonalizedAlerts`).

## Frozen Boundaries

- **Manager Profile**: Untouched; previously completed in `refactor/manager-profile-completion`.
- **`getSquadStats()`**: Remains untouched in `src/lib/db/queries/core/users.ts` for legacy consumers.
- **Cross-Domain Consumers**: Dashboard, Compare, Home, Assistant, Schedule retain their existing interfaces via thin forwarders to Managers server services.
- **Security & Mutation Boundaries**: Auth, credential repository, encryption, and mutations remain untouched.
