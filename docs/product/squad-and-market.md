---
title: Squad and Market
description: Lineup management, market analytics, listings, offers, and transfer actions.
audience:
  - user
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Squad and market

## Routes and behavior

`/lineup` displays the authenticated user's court, bench, roles, offers, and squad analysis. It can
initiate player swaps and market actions through dedicated APIs.

`/market` combines current listings and transfers with financial analytics such as value trends,
profit/loss, holding time, bidding duels, overpayment, liquidity, manager behavior, and player
availability. Market action endpoints support listing, removing, bulk listing, and accepting or
rejecting offers.

## Implementation map

- Pages: [`lineup`](<../../src/app/(app)/lineup>) and [`market`](<../../src/app/(app)/market>).
- UI: [`src/components/lineup`](../../src/components/lineup) and
  [`src/components/market`](../../src/components/market).
- Services: [`lineupService.ts`](../../src/lib/services/lineupService.ts), market read services, and
  [`marketActionsService.ts`](../../src/lib/services/marketActionsService.ts).
- Data: market queries, current ownership, lineups, transfers, bids, listings, and market-value
  history under [`src/lib/db`](../../src/lib/db).
- HTTP: `/api/market/*`, `/api/users/lineup`, and player squad endpoints.
- Tests: market route/action suites plus sync-market and lineup-related tests.

## Safety and consistency

Market actions call the Biwenger API and can change external league state; they must use the
authenticated user's provider token and validate ownership and inputs. Read-side market analytics
depend on the synchronization history and can lag provider state between jobs.

`market_values` is durable price history. `players.price` is the latest-price cache used by many
queries and can be audited or repaired from history through the
[database safety runbook](../operations/database-safety.md). Ownership updates must handle sales,
eliminations, purchases, and current-squad snapshots without erasing historical facts.
