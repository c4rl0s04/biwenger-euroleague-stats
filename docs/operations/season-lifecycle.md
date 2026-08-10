---
title: Season Lifecycle
description: Freeze a completed season and safely create and activate the next season.
audience:
  - operator
  - maintainer
  - agent
status: active
---

# Season lifecycle

Season records separate historical fantasy facts. A sync may write only to an active season whose
stored source league matches the configured Biwenger league.

## End-of-season freeze

1. Disable scheduled and live sync workflows.
2. Create fresh schema and data backups, row counts, and a copy of the Drizzle journal state.
3. Run the read-only audit locally:

   ```bash
   npm run db:season:audit
   ```

4. For a confirmed remote target, opt into the audit explicitly:

   ```bash
   ALLOW_REMOTE_SEASON_AUDIT=true npm run db:season:audit
   ```

5. After reviewing the audit and verifying backups, freeze the resolved season:

   ```bash
   BACKUP_CONFIRMED=true SEASON_ID=2025-26 npm run db:season:freeze
   ```

The command refuses to mutate state when backup confirmation is absent or the sync advisory lock is
unavailable. Replace the example ID with the season actually being closed.

## Create the next season

Only create a future season after reads and writes are ready to isolate it:

```bash
BACKUP_CONFIRMED=true \
NEXT_SEASON_ID=2026-27 \
NEXT_SEASON_NAME="EuroLeague Fantasy 2026-27" \
npm run db:season:create-next
```

Configure the new season through the canonical season variables described in the
[environment reference](../reference/environment-variables.md), including the season ID and its
matching Biwenger league/user values. For production sync, set
`SEASON_AWARE_READS_CONFIRMED=true` only after API read paths have been audited against mixed-season
responses.

No ownership or other season fact is copied automatically. Users, ownership, transfers, market
values, lineups, and standings must be populated for the new season by the appropriate controlled
workflow.

## Guard behavior

The sync guard rejects invalid configuration, unknown seasons, frozen/archived seasons, missing
source-league bindings, and mismatches between the database season and configured league. Production
also requires explicit confirmation of season-aware reads.

`ALLOW_SYNC_ON_FROZEN_SEASON=true` is a non-production diagnostic override. Never set it in
production or use it as a substitute for creating the correct active season.
