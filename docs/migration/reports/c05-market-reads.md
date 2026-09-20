---
title: C05 Public Market Reads migration
description: Source contracts, query reconciliation, frozen mutation boundaries and verification evidence for the Market read slice.
audience:
  - contributor
  - agent
status: active
---

# C05 Public Market Reads migration

Current integration checkpoint (2026-09-20): **MERGED**, PR #38, `0253f53f`.
Deployment was not reverified by this documentation update. Use the [master tracker](../tracker.md)
for remaining work and current task IDs. Original baselines, counts and pre-merge states below
are historical acceptance evidence, not new test results or active assignments.

## Original receipt (historical)

Baseline: `3c2a3ac8ce403b6a3d93b8256b9806931c4969d9` on `main` (PR #37 merge).
Worktree: `/Users/carlosandreshuete/Documents/Projects/biwengerstats-next-market-reads`
Branch: `integration/market-reads-migration`
Status: IMPLEMENTED AND LOCALLY VERIFIED / AWAITING INDEPENDENT REVIEW.

## Executive summary

The C05 Public Market Reads migration establishes complete feature ownership for all public Market read experiences in `src/features/market/`:

1. `/market` and `/market/[section]` server pages now consume `src/features/market/server` services and compose feature-owned desktop/mobile screens.
2. The 6 public Market GET Route Handlers (`/api/market`, `/api/market/stats`, `/api/market/stats/value-details`, `/api/market/transfers`, `/api/market/trends`, `/api/market/duels/details`) delegate directly to feature services.
3. Private Market operations (`src/lib/services/marketActionsService.ts`, `/api/market/offers/**`, `/api/market/sell*`, `/api/market/remove`) remain strictly frozen, untouched, and unmigrated pending subsequent provider/mutation security review.
4. Compatibility adapters in `src/lib/db/queries/features/market.ts` and `src/lib/services/features/marketService.ts` forward to feature services, ensuring Dashboard and Assistant continue functioning with 100% contract fidelity without unapproved domain creep.
5. All 9 SQL query modules in `src/features/market/server/queries/` are reconciled against the authoritative multi-season schema from `origin/main` (`user_seasons us`, `player_seasons ps`).
6. The legacy iterable defect in `/market/bids` on mobile (`loadLegacyBids()` spreading non-iterable `stats.biddingDuels`) was intentionally preserved.

## Routes and HTTP contracts

- `/market`:
  - Desktop: Renders `DesktopMarketScreen`, composing Listings, Transactions, Duels, Trends, Investment Rankings, and KPIs.
  - Mobile: Renders `MobileMarketScreen`, orchestrating tabbed sections.
- `/market/[section]`:
  - Mobile sections: `transfers`, `investments`, `bids`, `trends`.
  - Bounded route handling and validation via registered mobile routes in `src/lib/mobile/routes.ts`.
- API Route Handlers:
  - `GET /api/market`: returns `getMarketPageData()` containing `{ kpis, transfers, trends }` with a validated-but-unused `limit` query parameter (default 50, min 1, max 500, preserving existing contract). Cache headers: `public, max-age=300, stale-while-revalidate=60` (`CACHE_DURATIONS.MEDIUM`); errors: `private, no-store, max-age=0, must-revalidate`.
  - `GET /api/market/stats`: returns full market analytics payload (`currentMarketListings`, `recordTransfer`, `biddingDuels`, `bestFlip`, `worstFlip`, etc.). Cache headers: `public, max-age=300, stale-while-revalidate=60`.
  - `GET /api/market/stats/value-details`: returns transfer value round progression. Cache headers: `public, max-age=300, stale-while-revalidate=60`.
  - `GET /api/market/transfers`: paginated historical transfers list with buyer/seller filtering. Cache headers: `public, max-age=60, stale-while-revalidate=60` (`CACHE_DURATIONS.SHORT`).
  - `GET /api/market/trends`: rolling window market valuation and transaction volume trends. Cache headers: `public, max-age=60, stale-while-revalidate=60` (`CACHE_DURATIONS.SHORT`).
  - `GET /api/market/duels/details`: head-to-head bidding duel history between two managers. Cache headers: `public, max-age=60, stale-while-revalidate=60` (`CACHE_DURATIONS.SHORT`).

## Schema reconciliation against authoritative multi-season main

During the recovery from historical branches (`refactor/architecture-completion` and `chore/market-visual-baseline`), all market queries were updated to align with the authoritative PostgreSQL schema on `main`:

- In `main`, player attributes `position`, `team_id`, `price`, `price_increment`, and `puntos` belong to `player_seasons ps`, not `players p`.
- User attributes `color_index` and `icon` belong to `user_seasons us`, not `users u`.
- Joins were reconciled across all 9 market query files:
  - `market-summary.query.ts`
  - `market-overview.query.ts`
  - `market-activity.query.ts`
  - `market-activity-extra.query.ts`
  - `market-catalogue.query.ts`
  - `market-investments.query.ts`
  - `market-transfers.query.ts`
  - `market-auctions.query.ts`
  - `market-trends.query.ts`
- Manager directory lookups use the neutral shared query `readManagerDirectory()` from `@/lib/db/queries/core/manager-directory` (wrapped in `readMarketManagerDirectory()`) to map to domain view models without circular feature dependencies.
- Production sort semantics in `readRecordTransfer` strictly preserve `origin/main` (`ORDER BY f.precio DESC`). Deterministic ordering across tests is guaranteed by distinct price fixtures in the synthetic test suite rather than modifying production SQL queries.

## Frozen boundaries and backward compatibility

- **Private Operations**: `src/lib/services/marketActionsService.ts` and mutation API routes (`/api/market/offers/accept`, `/api/market/offers/reject`, `/api/market/sell`, `/api/market/sell-all`, `/api/market/remove`) were NOT moved or modified, remaining byte-identical to `origin/main`.
- **Cross-Domain Consumers**:
  - Dashboard: `/dashboard` and `src/lib/services/app/dashboardService.ts` consume `getMarketKPIs`, `getMarketOpportunities`, and `getRecentMarketActivity`. Compatibility adapters forward these to `src/features/market/server`.
  - Assistant: `assistantContextService.ts` consumes `getMarketTrends` and `getRecentMarketActivity` via legacy query adapters.
  - Teams: Cross-boundary team competition lookups were cleanly encapsulated in `src/features/teams` server services.
- **Config**: `src/lib/config.js` has zero diff against `origin/main`.

## Verification and test evidence

- **Architecture Audit**: `npm run architecture:check` passed with 913 modules and 59 protected entrypoints (0 violations).
- **TypeScript Typecheck**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint` passed with 0 errors (24 pre-existing non-blocking next/image warnings).
- **Unit and Contract Tests**: `npm run test:run` passed (257 test files passed, 1 skipped; 2123 tests passed, 1 skipped).
- **Production Build**: `npm run build` completed successfully with static and dynamic routes validated.
- **E2E Visual & Interaction Tests**:
  - `npm run test:e2e:local -- tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440`: Passed (2/2 tests passed, 0 snapshot diffs).
  - `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440`: Passed (2/2 tests passed, 0 snapshot diffs).
  - Populated browser suite covers `MarketTrendsChart` on desktop (verifying `/api/market/trends?days=30` and `0.9M €`, switching to `3M` and verifying `/api/market/trends?days=90` network response and `1.5M €`, hovering to verify tooltip details, and capturing `market-populated-trends-chart` reference snapshot).
  - Verified preservation of runtime TypeError in `/market/bids` on iPhone 13 (`TypeError: (a.biddingDuels ?? []) is not iterable`).
