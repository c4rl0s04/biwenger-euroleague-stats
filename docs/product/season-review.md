---
title: Season review
description: Read-only 2025/26 inequality autopsy and recovery stress-test simulator.
audience:
  - user
  - contributor
  - maintainer
status: active
---

# Season review

`/season-review` is a temporary authenticated workspace for measuring how quickly inequality
appeared after every manager started with exactly €40 million between cash and a random squad. It
does not update Biwenger settings or write analysis results to the database.

## Behavior

The page reconstructs a daily economic ledger, separates cash from productive squad value, and
decomposes the gap between the final leader and laggard into initial-player returns, market returns,
and round bonuses. The simulator then applies the same bad-signing, bad-streak, injury, and
inactivity shocks to valid Biwenger configurations.

Squad limits cover every integer from 10 to 25, automatic market supply is capped at 20, and round
bonuses can be direct or inverse only. Recovery is reported separately for economic resources and
competitive squad capacity. Recommendations cover maximum resilience, competitive balance, and
merit.

Finance events are deduplicated before aggregation. Cash and total resources remain estimates
because historical balance snapshots and salaries are not available. Complete free-agent snapshots
start in March; earlier market opportunity analysis uses completed transfers and their recorded
bids. Counterfactual outputs are stress tests rather than claims about decisions users would
definitely have made.

## Internal flow

- The page entry authenticates and loads a cached server-side overview.
- [`seasonResilienceService.ts`](../../src/lib/services/features/seasonResilienceService.ts)
  normalizes the frozen data, builds the historical autopsy, and coordinates recommendations.
- [`resilience.ts`](../../src/lib/season-review/resilience.ts) contains the pure daily-ledger,
  payout, roster-pressure, and recovery simulation logic.
- A validated authenticated server action recalculates custom scenarios after the controls settle.

The feature adds no schema objects, migrations, or database mutations.
