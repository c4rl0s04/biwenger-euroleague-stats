# Multi-Season Data Integrity

The frozen `2025-26` rows are historical data and must not be rewritten. Runtime reads and every
sync provider use one canonical configuration from `src/lib/config.js`:

```bash
SEASON_ID=2026-27
SEASON_NAME="EuroLeague Fantasy 2026-27"
BIWENGER_LEAGUE_ID=123456
BIWENGER_USER_ID=789012
EUROLEAGUE_SEASON_CODE=E2026
LEAGUE_START_DATE=2026-09-01
```

`BIWENGER_TOKEN` is a credential, not season metadata, but it is required for provider checks and
syncs. `SEASON_AWARE_READS_CONFIRMED=true` is a final production activation gate.

The database does not choose a season for the application. It validates the configured target:

- the `SEASON_ID` row must exist and be `active`;
- `seasons.source_league_id` must equal `BIWENGER_LEAGUE_ID`;
- frozen and archived seasons reject writes;
- production rejects sync until season-aware reads are confirmed.

## End-Of-Season Freeze

1. Disable scheduled and live sync workflows.
2. Create schema-only and data-only Supabase dumps, table row counts, and a migration journal copy.
3. Run the read-only season audit locally, then remotely after confirming the backup:

   ```bash
   npm run db:season:audit
   ALLOW_REMOTE_SEASON_AUDIT=true npm run db:season:audit
   ```

4. Freeze the configured season:

   ```bash
   BACKUP_CONFIRMED=true SEASON_ID=2025-26 npm run db:season:freeze
   ```

The freeze command refuses to run while a sync advisory lock is held.

## Create And Activate A New Season

1. Set the complete canonical configuration locally. Do not enable workflows yet.
2. Create the active database season. The command stores the configured Biwenger league binding and
   requires a confirmed backup:

   ```bash
   BACKUP_CONFIRMED=true npm run db:season:create-next
   ```

3. Run the read-only preflight:

   ```bash
   npm run sync:preflight
   ```

   It validates configuration, season status, the database/league binding, Biwenger membership,
   player/team counts, and the official EuroLeague schedule. It executes only database `SELECT`
   statements and provider `GET` requests.

4. Test controlled sync steps against a disposable database clone.
5. Audit ownership, prices, users, teams, and API reads for the new season.
6. Set `SEASON_AWARE_READS_CONFIRMED=true` in production and rerun preflight.
7. Unpause the scheduled workflow, then the live workflow.

No ownership is copied automatically. Users, ownership, transfers, market values, lineups, and
standings are season facts. The legacy `DEFAULT_SEASON_ID = '2025-26'` remains only for migration and
bootstrap compatibility; runtime sync selection never uses it.

## Provider Version Safety

The Biwenger private API version is detected from `/account`. Sync fails closed if detection fails.
`BIWENGER_API_VERSION_FALLBACK` is an optional emergency override and should only be set after
checking the current web client's requests.

A local-only frozen-season override exists for diagnostics:

```bash
ALLOW_SYNC_ON_FROZEN_SEASON=true
```

Never set this override in production.
