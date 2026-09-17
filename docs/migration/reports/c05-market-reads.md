---
title: C05 Public Market Reads migration
description: Source contracts, query reconciliation, frozen mutation boundaries and verification evidence for the Market read slice.
audience:
  - contributor
  - agent
status: active
---

# C05 Public Market Reads migration

Baseline: `3c2a3ac8ce403b6a3d93b8256b9806931c4969d9` on `main` (PR #37 merge).
Worktree: `/Users/carlosandreshuete/Documents/Projects/biwengerstats-next-market-reads`
Branch: `integration/market-reads-migration`
Status: IMPLEMENTED AND LOCALLY VERIFIED.

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
  - Mobile sections: `overview`, `transfers`, `bids`, `trends`, `investments`, `activity`.
  - Bounded route handling and validation via `MARKET_SECTION_ORDER`.
- API Route Handlers:
  - `GET /api/market`: returns live market listings (cache policy: `public, max-age=60, s-maxage=120, stale-while-revalidate=300`).
  - `GET /api/market/stats`: returns full market analytics payload (cache policy: `public, max-age=300, s-maxage=600, stale-while-revalidate=1800`).
  - `GET /api/market/stats/value-details`: returns transfer value round progression.
  - `GET /api/market/transfers`: paginated historical transfers list with buyer/seller filtering.
  - `GET /api/market/trends`: rolling window market valuation and transaction volume trends.
  - `GET /api/market/duels/details`: head-to-head bidding duel history between two managers.

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
- Manager directory lookups were decoupled into `market-manager.query.ts` querying `user_seasons` directly for the active season to avoid circular feature dependencies.
- Secondary sort keys (`ORDER BY f.precio DESC, f.timestamp DESC NULLS LAST, f.id DESC`) were added to `readRecordTransfer` for deterministic ordering under tie prices matching historical visual baseline snapshots.

## Frozen boundaries and backward compatibility

- **Private Operations**: `src/lib/services/marketActionsService.ts` and mutation API routes (`/api/market/offers/accept`, `/api/market/offers/reject`, `/api/market/sell`, `/api/market/sell-all`, `/api/market/remove`) were NOT moved or modified.
- **Cross-Domain Consumers**:
  - Dashboard: `/dashboard` and `src/lib/services/app/dashboardService.ts` consume `getMarketKPIs`, `getMarketOpportunities`, and `getRecentMarketActivity`. Compatibility adapters forward these to `src/features/market/server`.
  - Assistant: `assistantContextService.ts` consumes `getMarketTrends` and `getRecentMarketActivity` via legacy query adapters.
  - Teams: Cross-boundary team competition lookups were cleanly encapsulated in `src/features/teams` server services.

## Verification and test evidence

- **Architecture Audit**: `npm run architecture:check` passed with 913 modules and 59 protected entrypoints (0 violations).
- **TypeScript Typecheck**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint` passed with 0 errors (24 pre-existing non-blocking next/image warnings).
- **Unit and Contract Tests**: `npm run test:run` passed (257 test files passed, 1 skipped; 2123 tests passed, 1 skipped).
- **Production Build**: `npm run build` completed successfully with static and dynamic routes validated.
- **E2E Visual & Interaction Tests**:
  - `npm run test:e2e:local -- tests/e2e/market.spec.ts --project=iphone-13 --project=desktop-1440`: Passed (2/2 tests passed, 0 snapshot diffs).
  - `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440`: Passed (2/2 tests passed, 0 snapshot diffs).
  - Verified preservation of runtime TypeError in `/market/bids` on iPhone 13 (`TypeError: (a.biddingDuels ?? []) is not iterable`).
