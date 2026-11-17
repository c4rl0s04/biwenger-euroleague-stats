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
stored league binding matches the ingestion token’s discovered membership.

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
   BACKUP_CONFIRMED=true npm run db:season:freeze -- --season=2025-26
   ```

The command refuses to mutate state when backup confirmation is absent or the sync advisory lock is
unavailable. Replace the example ID with the season actually being closed.

## Create the next season

Only create a future season after reads and writes are ready to isolate it:

```bash
BACKUP_CONFIRMED=true npm run db:season:create-next -- \
  --season=2026-27 --name="EuroLeague Fantasy 2026-27" \
  --league=123 --start-date=2026-09-01
```

Replace example values with the reviewed season metadata. `--euroleague-code` defaults to the
season start year’s `EYYYY`; `--end-date` is optional. Inputs are validated before connecting.
Creation works on an initialized empty database without an ingestion token. It refuses activation
while another season is active. Metadata is stored once; web and sync deployments need no season
variable edits. Both freeze and creation hold synchronization advisory locks on the same connection
for the whole operation. Backup confirmation remains mandatory.

No ownership or other season fact is copied automatically. Users, ownership, transfers, market
values, lineups, and standings must be populated for the new season by the appropriate controlled
workflow.

## Guard behavior

The sync guard requires one target season, active and sync-enabled, with a numeric league binding,
a matching official code and a valid start date. Explicit `--season` targeting is supported by the
main sync command. Read/write isolation is enforced by explicit seasonal queries and writes rather
than an environment assertion. Database errors never select a historical fallback.

`ALLOW_SYNC_ON_FROZEN_SEASON=true` is a non-production diagnostic override. Never set it in
production or use it as a substitute for creating the correct active season.
