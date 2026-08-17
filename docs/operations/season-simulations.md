---
title: Season simulations
description: Run, validate, and publish complete-season Monte Carlo analysis for the season review.
audience:
  - operator
  - maintainer
  - contributor
status: active
---

# Season simulations

The simulator reads the frozen `2025-26` season and does not write to PostgreSQL or Biwenger. It
generates aggregate JSON containing no credentials or raw private payloads.

## Recommended execution

Open **Actions → Season simulations → Run workflow**, select the number of seasons per
configuration, and start the workflow. Five parallel jobs evaluate roster, payout, market, and
preset groups. A final job merges the artifacts, commits
[`season-simulation-results.json`](../../src/data/season-simulation-results.json), and lets the normal
deployment pipeline publish the new summary.

- `250` runs provide medium confidence for a quick calibration pass.
- `500` or `1,000` runs are appropriate for configuration decisions.
- `2,000` runs provide the narrowest supported intervals and may take substantially longer.

The workflow needs the same read-only database connection secrets used by scheduled sync. It does
not need Biwenger credentials.

## Local diagnostic run

Use a configured database connection and keep the output outside tracked source unless it has been
reviewed:

```bash
SIMULATION_GROUP=presets \
SIMULATION_RUNS=10 \
SIMULATION_OUTPUT=artifacts/season-simulations-presets.json \
npm run simulation:run
```

Available groups are `roster-low`, `roster-high`, `payout`, `market`, and `presets`. Local runs are useful for
benchmarking and validation; the GitHub workflow is the canonical publisher.

## Verification

Before trusting a refreshed result, inspect:

- player, round, and user counts in the artifact;
- median simulated market movements against the 839 observed transfer events;
- final resource and squad Gini against the reconstructed historical ranges;
- the 95% recovery interval and whether doubling the run count materially changes it;
- workflow duration and any failed matrix group.

The page labels calibration as strong when simulated transfers stay within 20% of the observed
total and both closing Gini values stay within 0.03 of the reconstructed values. Errors up to 40%
and 0.06 respectively are acceptable; anything wider is weak and should be recalibrated before
using the recommendations.

Percentages are estimates from modeled user strategies. Even a high run count reduces sampling
error but cannot remove uncertainty in the behavior model or missing pre-March market snapshots.
