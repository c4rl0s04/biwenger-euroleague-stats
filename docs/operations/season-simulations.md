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

Open **Actions → Season simulations → Run workflow** and choose the number of paired seasons for
each stage. The defaults execute the production analysis:

1. Screen all 1,920 combinations with 64 shock/no-shock pairs each.
2. Retain at most 120 candidates across the public rankings and Pareto frontier.
3. Refine those candidates with 512 pairs each and retain 24 finalists.
4. Run 4,096 pairs per finalist, calculate final distributions and calibrate the historical anchor.

The grid contains every squad limit from 10–25, every daily market size from 1–20, and direct or
inverse bonuses at €5,000, €7,500, or €10,000 per point. Shards use the same seed manifest so a rule
is never favoured by receiving easier random seasons. The final job commits
[`season-simulation-analysis.json`](../../src/data/season-simulation-analysis.json); this is the
backend contract for the future ranking interface.

The workflow needs the same read-only database connection secrets used by scheduled sync. It does
not need Biwenger credentials.

## Local diagnostic run

Use a configured read-only database connection and keep diagnostic output outside tracked source:

```bash
SIMULATION_STAGE=screen \
SIMULATION_PAIRS=2 \
SIMULATION_CONFIG_LIMIT=2 \
SIMULATION_SHARD_INDEX=0 \
SIMULATION_SHARD_COUNT=1 \
SIMULATION_OUTPUT=/tmp/season-analysis-shard.json \
npm run simulation:analysis:run
```

`SIMULATION_CONFIG_LIMIT` exists only for local diagnostics. Refinement and final runs also require
`SIMULATION_INPUT` pointing to the merged artifact from the preceding stage. The GitHub workflow is
the canonical publisher and handles these dependencies automatically.

## Statistical output

Every configuration stores percentiles and compact histograms for economic inequality, squad
inequality, absolute gaps, time to gap thresholds, competitive mobility, market activity, bidder
competition, inflation, merit, shock losses, and recovery time. Probabilities use Wilson 95%
intervals and are broken down by shock type, severity, and season phase.

Rankings cover equality, competitive balance, resilience, merit, and a balanced objective. Their
weights are part of the artifact, alongside dimension scores, Pareto membership, and estimated
top-ten frequency under sampling uncertainty. The historical configuration is always retained as a calibration anchor even if
it would otherwise fail a shortlist cutoff.

## Verification

Before trusting a refreshed result, inspect:

- player, round, and user counts in the artifact;
- median simulated market movements against the 839 observed transfer events;
- final resource and squad Gini against the reconstructed historical ranges;
- the recovery intervals and whether doubling pair counts materially changes the finalist order;
- top-ten frequency and Pareto membership rather than only the composite score;
- workflow duration and any failed matrix group.

The page labels calibration as strong when simulated transfers stay within 20% of the observed
total and both closing Gini values stay within 0.03 of the reconstructed values. Errors up to 40%
and 0.06 respectively are acceptable; anything wider is weak and should be recalibrated before
using the recommendations.

Percentages are estimates from modeled user strategies. High pair counts reduce sampling error but
cannot remove behavioral-model uncertainty or missing pre-March market snapshots. The checked-in
analysis contains aggregates, not raw private database rows or individual simulated timelines.
