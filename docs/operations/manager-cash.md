---
title: Manager cash report
description: Run the manager cash ledger from GitHub without a local setup.
audience:
  - operator
  - maintainer
status: active
---

# Manager cash report

Open **Actions → Manager cash report → Run workflow**, select **main**, and run it.
Leave the manager field empty for everyone, or enter a manager name substring or ID.
Detailed output defaults to enabled; disable it for the cash overview only. A manager
filter always includes that manager's details alongside the league summary.

Open the completed run to read the cash ranking on your phone. Tap a manager to expand
their cash calculation, transactions, bonuses, and squads. Copy the run's URL to share
the report. This repository is public, so anyone with the link can read the run summary.
The full text report remains under **Artifacts** for seven days.

The [workflow](../../.github/workflows/manager-cash.yml) runs the existing
`npm run ledger` command against the latest synced database data. It does not start
a sync or change stored data. PostgreSQL connections default to read-only transactions
with a 60-second statement timeout. It reuses Scheduled Sync's `POSTGRES_HOST`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and optional `POSTGRES_PORT`
repository secrets; no additional secret or provider credential is needed.

Cash adjustments include round bonuses, administrative credits, and loan fees. A
loan fee credits the lender and charges the borrower when the loan starts; the
player's return does not move cash. A report run only reads what has already synced.
To include loans older than the routine sync's seven-day board window, run a
one-time board history sync after deploying the fix:

```bash
npm run sync:bootstrap -- --step=biwenger-board
```

This command writes to the configured database. Review its target and obtain the
required production approval before running it, then generate a new report.

The existing ledger defaults apply: the active season, a €40,000,000 budget, and
September 19, 2026 as the initial squad valuation date. Initial prices use the exact
date when present, otherwise the nearest later price, then the nearest earlier price.
These defaults should be reviewed before using the workflow for another season.

For custom season, budget, or valuation date, the local CLI still supports
`--season=`, `--budget=`, and `--start-date=`. The workflow is manual only and does not
change scheduled synchronization.
