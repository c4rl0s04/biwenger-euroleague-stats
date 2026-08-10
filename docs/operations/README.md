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
- [Database safety](database-safety.md) — backups, audits, migrations, and price-cache repair.
- [Season lifecycle](season-lifecycle.md) — freeze a completed season and activate the next one.
- [Troubleshooting](troubleshooting.md) — diagnose common application, database, and sync failures.

Operational notes contain commands that can mutate databases or external Biwenger state. Confirm the
target environment and read the warnings around a command before running it. Architecture and data
flow explanations are maintained separately in [data and sync architecture](../architecture/data-and-sync.md).
