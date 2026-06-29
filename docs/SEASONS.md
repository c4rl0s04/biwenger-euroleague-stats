# Multi-Season Data Integrity

The `2025-26` database state is treated as the canonical frozen season snapshot.
Sync jobs must remain disabled until a new active season is created and production
has `SYNC_SEASON_ID` configured for that active season.

## End-Of-Season Freeze

1. Disable scheduled and live sync workflows.
2. Create a fresh Supabase backup:
   - schema-only `pg_dump`
   - data-only `pg_dump`
   - row counts for application tables
   - Drizzle migration journal state
3. Run the read-only audit locally first:

   ```bash
   npm run db:season:audit
   ```

4. For Supabase, run only after backup confirmation:

   ```bash
   ALLOW_REMOTE_SEASON_AUDIT=true npm run db:season:audit
   ```

5. Freeze a season only after backup confirmation:

   ```bash
   BACKUP_CONFIRMED=true SEASON_ID=2025-26 npm run db:season:freeze
   ```

The freeze command refuses to run if the sync advisory locks are unavailable.

## Next Season Creation

Create the next season only when the app is ready for season-aware writes:

```bash
BACKUP_CONFIRMED=true \
NEXT_SEASON_ID=2026-27 \
NEXT_SEASON_NAME="EuroLeague Fantasy 2026-27" \
npm run db:season:create-next
```

Then configure production sync with:

```bash
SYNC_SEASON_ID=2026-27
SEASON_AWARE_READS_CONFIRMED=true
```

Only set `SEASON_AWARE_READS_CONFIRMED=true` after API reads are audited to avoid
mixed-season responses once new season fact rows exist.

No ownership is copied automatically from the previous season. That is deliberate:
users, ownership, transfers, market values, lineups, and standings are season facts.

## Sync Guard

Every mutating sync run requires `SYNC_SEASON_ID`.

The guard rejects:

- missing `SYNC_SEASON_ID`
- unknown seasons
- `frozen` or `archived` seasons
- future production seasons without `SEASON_AWARE_READS_CONFIRMED=true`

A local-only override exists for diagnostics:

```bash
ALLOW_SYNC_ON_FROZEN_SEASON=true
```

Do not set that override in production.
