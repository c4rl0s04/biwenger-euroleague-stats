---
title: Operations
description: Runbook map for setup, synchronization, database safety, seasons, and recovery.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Operations

- [Docker](docker.md) — start and inspect the provided three-service environment.
- [Data sync](data-sync.md) — preflight and execute full, daily, live, or targeted ingestion.
- [EuroLeague official website sync](euroleague-website-sync.md) — scrape and synchronize official photoshoot portraits, codes, and bio data.
- [Database safety](database-safety.md) — backups, audits, migrations, and price-cache repair.
- [Credential encryption](credential-encryption.md) — manager credential deployment, migration,
  rotation, rollback, and cleanup gates.
- [Deployment and rollback](deployment-and-rollback.md) — production deployment lifecycle, post-deploy
  smoke checks, and tiered rollback procedures.
- [Season lifecycle](season-lifecycle.md) — freeze a completed season and activate the next one.
- [Season simulations](season-simulations.md) — calculate and publish complete-season Monte Carlo
  results.
- [Season data audit](season-data-audit.md) — findings from the isolated season snapshot audit.
- [Season data copy receipt](season-data-copy-receipt.md) — preparation receipt for the isolated season
  copy.
- [Season data integrity stabilization](season-data-integrity-stabilization.md) — multi-season database
  stabilization, architectural audit, and safe migration runbook.
- [Statistics normalization investigation](statistics-normalization-investigation.md) —
  provider-independent statistics investigation and proposed contract.
- [Troubleshooting](troubleshooting.md) — diagnose common application, database, and sync failures.

Operational notes contain commands that can mutate databases or external Biwenger state. Confirm the
target environment and read the warnings around a command before running it. Architecture and data
flow explanations are maintained separately in [data and sync architecture](../architecture/data-and-sync.md).
