---
title: Season review
description: Read-only 2025/26 league economy analysis and counterfactual rules simulator.
audience:
  - user
  - contributor
  - maintainer
status: active
---

# Season review

`/season-review` is a temporary authenticated workspace for comparing league rules against the
frozen `2025-26` season. It does not update Biwenger settings or write analysis results to the
database.

## Behavior

The page combines the historical diagnosis with an interactive simulator for squad size, round
bonuses, placement bonuses, ideal-lineup and MVP bonuses, automatic market supply, squad-value
limits, and prize-budget normalization. It publishes separate recommendations for equality,
competitive balance, and merit rather than presenting one scoring philosophy as objectively best.

Finance events are deduplicated before aggregation. The simulator holds the estimated prediction
pool component constant and labels total resources as an estimate because historical cash balances
and salaries are not available. Market, roster, and squad-value constraints are shown as compliance
pressure rather than deterministic alternative history.

## Internal flow

- The page entry authenticates and loads a cached server-side overview.
- [`seasonReviewService.ts`](../../src/lib/services/features/seasonReviewService.ts) normalizes the
  frozen data and coordinates recommendations.
- [`engine.ts`](../../src/lib/season-review/engine.ts) contains deterministic scoring and simulation
  logic.
- A validated authenticated server action recalculates custom scenarios after the controls settle.

The feature adds no schema objects, migrations, or database mutations.
