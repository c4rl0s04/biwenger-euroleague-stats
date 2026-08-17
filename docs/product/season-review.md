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
and round bonuses. The recovery laboratory runs complete semi-random seasons with player-level
prices and points, seven strategy agents, market auctions, sales, lineups, bonuses, and the same
bad-signing, bad-streak, injury, or inactivity shock under every compared configuration.

Squad limits cover every integer from 10 to 25, automatic market supply is capped at 20, and round
bonuses can be direct or inverse only. Recovery is reported separately for economic resources and
competitive squad capacity. Recommendations cover maximum resilience, competitive balance, and
merit.

Interactive custom scenarios use a small paired sample and expose its 95% interval. The manual
GitHub workflow runs 250–2,000 seasons per configuration and publishes the aggregate JSON consumed
by the page. Historical and alternative rules reuse identical seeds so rule effects are not mixed
with different random seasons.

The laboratory also shows calibration against the observed number of transfers and the closing
resource and squad Gini. Recommendation cards are labelled as a structural preselection until the
offline artifact is ready; after publication they are selected and scored from full-season results
covering the four supported shocks.

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
  payout and roster-pressure logic.
- [`season-simulator.ts`](../../src/lib/season-review/season-simulator.ts) owns complete-season agent
  simulation and paired Monte Carlo aggregation.
- [`simulation-dataset.ts`](../../src/lib/season-review/simulation-dataset.ts) aligns historical
  player points and prices to simulation rounds.
- A validated authenticated server action recalculates custom scenarios after the controls settle.

See the [season simulation runbook](../operations/season-simulations.md) for offline execution and
publication.

The feature adds no schema objects, migrations, or database mutations.
