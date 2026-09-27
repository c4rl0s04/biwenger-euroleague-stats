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
Detailed output defaults to enabled; disable it for the summary table only. A manager
filter always includes that manager's details alongside the league summary.

Open the completed run to read its summary. Download the full text report from the
**Artifacts** section; downloads expire after seven days. Reports have the same
visibility as the repository's Actions results.

The [workflow](../../.github/workflows/manager-cash.yml) runs the existing
`npm run ledger` command against the latest synced database data. It does not start
a sync or change stored data. PostgreSQL connections default to read-only transactions
with a 60-second statement timeout. It reuses Scheduled Sync's `POSTGRES_HOST`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and optional `POSTGRES_PORT`
repository secrets; no additional secret or provider credential is needed.

The existing ledger defaults apply: the active season, a €40,000,000 budget, and
September 19, 2026 as the initial squad valuation date. Initial prices use the exact
date when present, otherwise the nearest later price, then the nearest earlier price.
These defaults should be reviewed before using the workflow for another season.

For custom season, budget, or valuation date, the local CLI still supports
`--season=`, `--budget=`, and `--start-date=`. The workflow is manual only and does not
change scheduled synchronization.
