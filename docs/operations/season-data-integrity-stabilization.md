---
title: Multi-Season Database and Synchronization Data Model Stabilization
description: Operational guide and architectural audit of the multi-season database model stabilization, dropped column cleanup, provider data integrity, and safe migration runbook.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Multi-Season Database and Synchronization Stabilization

## 1. Executive Summary

This document records the architectural hardening and data integrity stabilization of the multi-season database schema and synchronization pipeline in `biwenger-euroleague-stats`.

The multi-season model separates global identities (`players`, `teams`, `users`) from season-specific facts and performance (`player_seasons`, `team_seasons`, `user_seasons`, `player_round_stats`, `matches`). Migration `0014_drop_deprecated_seasonal_columns.sql` removed historical duplicate columns from global `players` and `teams`, and Migration `0015_dnp_provenance_and_match_venues.sql` added DNP participation tracking, official game provenance, and match venue support. This stabilization ensures that:

1. **Drizzle migrations** remain the sole authority for database schema (no runtime DDL / `ensureSchema()` bootstrapping).
2. **Dedicated migration & validation tooling** (`npm run db:migrate` and `npm run db:schema:validate`) allows operators to inspect and execute migrations safely.
3. **Zero stale column references** exist across all queries, services, and mappers, protected by a continuous AST architectural guard.
4. **Biwenger catalog & mutations** maintain authoritative current-season player updates, allowing downward score corrections, transfers, and valid zero-point values without artificial `GREATEST(...)` clamps.
5. **Official EuroLeague provider sync** preserves nullable sporting metrics, distinguishing between 0, valid absence (`null`), and non-participation (DNP).
6. **Round integrity invariant** enforces at most one match per team per fantasy round.
7. **Player mapping resolution** automatically re-triggers ingestion on unchanged payload checksums when unpersisted mapped player stats are detected, even when fantasy points already exist.
8. **Fail-closed season guard** prevents syncing when official EuroLeague provider bindings are missing, eliminating hardcoded fallbacks.
9. **Automated upgrade rehearsal** (`scripts/e2e/season-upgrade-integrity.ts`) proves that pre-0014 databases with populated legacy columns upgrade cleanly to 0014 and 0015 with zero data loss.

---

## 2. Issues Addressed and Architectural Fixes

### 2.1 Sole Schema Authority (No Runtime DDL) & Tooling

- **Problem**: Runtime `ensureSchema()` calls attempted ad-hoc `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` statements during sync operations, conflicting with Drizzle migrations. In addition, catalog queries in `validateSchemaReady()` quoted `"public"` as an identifier rather than a literal string (`'public'`), causing silent check mismatches.
- **Fix**:
  - Removed deprecated `ensureSchema()` from `src/lib/db/schema_init.ts` and eliminated all call sites from runtime code and test mocks.
  - Fixed schema name quoting (`'public'`) in `validateSchemaReady()`.
  - Added read-only verification in `validateSchemaReady()` for the absence of all 18 dropped seasonal columns and the presence of required EuroLeague columns (`is_dnp`, `official_game_code`, `arena_code`, `arena_name`, `arena_capacity`).
  - Implemented `npm run db:migrate` (`scripts/dev/migrate.ts`) to run committed Drizzle migrations safely in journal order within transactions.
  - Implemented `npm run db:schema:validate` (`scripts/dev/validate-schema.ts`) to run read-only preflight verification before sync or application start.

### 2.2 Complete Elimination of Dropped Seasonal Columns & AST Guard

- **Problem**: Queries and services retained fallback reads or selected dropped global columns (`p.puntos`, `p.price`, `t.city`, `t.arena_name`), which fail in production once migration 0014 runs.
- **Fix**:
  - Updated all feature queries across `features/teams`, `features/managers`, `features/search`, `features/players`, `features/rounds`, `features/standings`, `lib/db/queries`, and `lib/services` to read strictly from `team_seasons` (`ts.*`) and `player_seasons` (`ps.*`).
  - Strengthened the AST architectural guard `src/tests/architecture/seasonal-column-reads.test.ts` to inspect `.ts`, `.tsx`, `.js`, `.jsx` across all 14 dropped player columns and 4 dropped team columns.
  - Added support for dynamic SQL table aliases (`players pl`, `teams t_alias`) and scoped regex checks to prevent false positives on legitimate global identity columns (`p.img`, `t.code`, `t.img`).
  - Integrated 4 guard self-tests to prove that positive references, aliased references, and COALESCE patterns are caught reliably.

### 2.3 Authoritative Player Mutations & Catalog Semantics

- **Problem**: `upsertPlayer` in `src/lib/db/mutations/players.ts` used `GREATEST(...)` for points, price, and games played, preventing downward provider corrections and corrupting valid 0 scores. It also omitted `team_id = EXCLUDED.team_id`, causing mid-season transfers to fail to update the current season.
- **Fix**:
  - Updated `upsertPlayer` to directly set `team_id = EXCLUDED.team_id` and assign `puntos = EXCLUDED.puntos`, `partidos_jugados = EXCLUDED.partidos_jugados`, `price = EXCLUDED.price`.
  - Removed artificial points override heuristics in `src/lib/sync/services/biwenger/catalog.ts`. Valid 0 points from Biwenger are preserved authoritatively.

### 2.4 Nullable Sporting Metrics, DNP Preservation & Match Venues (Migration 0015)

- **Problem**:
  - Sporting statistics (`minutes`, `points`, `rebounds`, `assists`, `fouls`) coerced absent values or empty strings to `0`, conflating a player who played 0 minutes with an absent stat, and losing DNP status.
  - Match venues were previously conflated with team home arenas, ignoring neutral site or alternative venue fixtures.
- **Fix**:
  - Generated and committed `0015_dnp_provenance_and_match_venues.sql` and `drizzle/meta/0015_snapshot.json`.
  - Added `arena_code`, `arena_name`, `arena_capacity` to `matches` table.
  - Added `is_dnp` (boolean) and `official_game_code` (integer) to `player_round_stats` table.
  - Implemented strict parser `parseMinutes` in `EuroleagueAdvancedClient`: parses `'MM:SS'` to total seconds, `'DNP'` to `isDnp: true` with `null` seconds, empty strings to `null`, and rejects invalid formats.
  - Implemented `parseProviderNumber`: preserves `0` as `0`, null/empty as `null`, and throws on malformed non-numeric values.
  - Updated `quarters()` and regulation score calculation to retain `null` when quarters are unplayed.
  - Updated player queries and `buildAdvancedStats` in `player.mapper.ts` to filter out DNP matches (`(is_dnp IS FALSE OR (is_dnp IS NULL AND minutes > 0))`), compute games played accurately, and guard against zero-division / `NaN` when games played is 0.

### 2.5 One-Match-Per-Team-Per-Round Invariant

- **Problem**: In fantasy basketball, a team can only play once per round. Corrupted provider fixtures with duplicated teams could corrupt standings and round stats.
- **Fix**:
  - Added preflight validation in `src/lib/sync/services/biwenger/matches.ts` throwing an invariant violation if any team appears in multiple matches for the same round.
  - Added duplicate appearance detection in `upsertMatch` in `src/lib/db/mutations/matches.ts`.

### 2.6 Unresolved Player Mapping Retry on Checksum Match

- **Problem**: If fantasy sync ran before official EuroLeague sync, a row was created in `player_round_stats` with `fantasy_points` but without official stats. `hasUnpersistedMappedPlayers` previously checked `prs.id IS NULL`, which falsely returned `false` because the row already existed.
- **Fix**:
  - Updated `hasUnpersistedMappedPlayers` in `src/lib/db/mutations/official/game-data.ts` to check `prs.id IS NULL OR prs.official_game_code IS NULL`.
  - In `src/lib/sync/services/euroleague/games.ts`, if the checksum matches, `hasUnpersistedMappedPlayers` detects mapped players who lack official boxscore stats and triggers re-ingestion, preserving existing `fantasy_points`.

### 2.7 Fail-Closed Season Guard

- **Problem**: `assertSyncSeasonWritable` in `src/lib/sync/season-guard.ts` fell back to config/env defaults when `euroleague_code` was missing from the seasons table, risking corrupting future seasons.
- **Fix**:
  - Eliminated config and environment fallbacks across `season-guard.ts`, `services/euroleague/games.ts`, `services/euroleague/master-data.ts`, and `services/biwenger/matches.ts`.
  - Missing `euroleague_code` throws `SEASON_EUROLEAGUE_CODE_MISSING` fail-closed error.

---

## 3. Safe Upgrade Runbook for Existing Databases

When upgrading existing environments to schema migrations 0014 and 0015:

```text
[Starting State: 0013 Baseline Database]
         │
         ▼
[Step 1: Pre-Migration Backup (pg_dump)]
         │
         ▼
[Step 2: Canonical Backfill (if needed): npm run db:season:backfill-2025]
         │
         ▼
[Step 3: Pre-0014 Hard Safety Check: npm run db:pre0014:check]
         │
         ▼
[Step 4: Apply Migrations 0014 & 0015: npm run db:migrate]
         │
         ▼
[Step 5: Validate Schema Readiness: npm run db:schema:validate]
```

### Starting State Precondition

The database must be migrated through `0013_careful_doctor_strange.sql`. All seasonal tables (`player_seasons`, `team_seasons`, `user_seasons`) exist, and deprecated seasonal columns (`players.puntos`, `teams.city`, etc.) are still present.

### Step 1: Pre-Migration Backup

Before running schema migrations:

```bash
pg_dump -Fc --no-acl --no-owner "$DATABASE_URL" > "backup_pre_0014_$(date +%Y%m%d_%H%M%S).dump"
```

### Step 2: Canonical Data Backfill

If unmigrated records exist or seasonal tables are empty, execute the canonical, idempotent backfill procedure:

```bash
npm run db:season:backfill-2025
```

This populates all 14 seasonal player fields into `player_seasons` and all 4 seasonal team fields into `team_seasons`. It is safe to run multiple times (idempotent: $A = B$).

### Step 3: Verify Pre-0014 Safety Check

Execute the automated hard safety check before dropping columns:

```bash
npm run db:pre0014:check
# Or explicitly targeting the historical cutover season:
npm run db:pre0014:check -- --season=2025-26
```

This CLI explicitly targets historical season `2025-26` (not inferred dynamically from `status = 'active'`) and verifies that:

1. Target season `2025-26` exists in the `seasons` table.
2. Every player in `players` has a matching record in `player_seasons` for `2025-26`.
3. Every team in `teams` has a matching record in `team_seasons` for `2025-26`.
4. All 18 migrated columns match exactly between source and seasonal destination records (using `IS DISTINCT FROM`):
   - **14 player columns**: `position`, `puntos`, `partidos_jugados`, `played_home`, `played_away`, `points_home`, `points_away`, `points_last_season`, `owner_id`, `status`, `price_increment`, `price`, `dorsal`, `team_id`
   - **4 team columns**: `city`, `arena_name`, `latitude`, `longitude`

The command returns exit code `0` when safe to proceed, or exits non-zero if ANY value differs.

### Step 4: Apply Migrations 0014 and 0015

Run the migration runner:

```bash
npm run db:migrate
```

This applies:

- `drizzle/0014_drop_deprecated_seasonal_columns.sql`: drops all 18 deprecated columns (`position`, `puntos`, `partidos_jugados`, `price`, `team_id`, `status`, `price_increment`, `played_home`, `played_away`, `points_home`, `points_away`, `points_last_season`, `owner_id`, `dorsal` on `players`; `city`, `arena_name`, `latitude`, `longitude` on `teams`).
- `drizzle/0015_dnp_provenance_and_match_venues.sql`: adds `arena_code`, `arena_name`, `arena_capacity` to `matches`, and `is_dnp`, `official_game_code` to `player_round_stats`.

### Step 5: Verify Schema Readiness

Run the standalone schema validation preflight:

```bash
npm run db:schema:validate
```

---

## 4. Production Cutover & Upgrade Rehearsal Status

### 4.1 Automated Upgrade Rehearsal

The migration sequence from baseline through 0013, the population of all 18 deprecated seasonal columns with distinct non-default values, the canonical data backfill into `player_seasons` and `team_seasons`, the verification of backfill idempotency ($A = B$), the destructive column drop in 0014, additions in 0015, and tri-state DNP semantics are verified end-to-end via:

```bash
npm run test:e2e:local
```

This automated rehearsal (`scripts/e2e/season-upgrade-integrity.ts`) runs against real disposable PostgreSQL and proves that:

1. All 18 deprecated columns exist and hold data at 0013.
2. The canonical backfill procedure copies all 18 columns accurately to destination tables.
3. Repeated execution of the canonical backfill is strictly idempotent ($A = B$, unchanged row counts).
4. Migration 0014 drops all 18 deprecated columns cleanly without foreign key or dependency errors.
5. All 18 backfilled values survive intact post-drop.
6. Migration 0015 adds venue and DNP columns cleanly.
7. `validateSchemaReady` passes on the upgraded schema.

### 4.2 2025-26 Live Production Status

- **Codebase & Architecture**: Genuinely merge-ready. Zero stale column reads, sole DDL authority established, AST guards active, and all unit/integration tests passing.
- **Local Rehearsal**: Fully verified with real PostgreSQL.
- **Live Production Database**: The actual live production database will execute migrations 0014 and 0015 during deployment. Verification on live production requires production database credentials and maintenance window authorization, following the runbook in Section 3.

---

## 5. Verification Suite

All modifications are verified through the repository's verification pipeline:

| Gate                    | Command                            | Scope / Coverage                                                                     | Result |
| :---------------------- | :--------------------------------- | :----------------------------------------------------------------------------------- | :----- |
| **Typecheck**           | `npm run typecheck`                | Full repository TypeScript compilation                                               | Passed |
| **Unit & Architecture** | `npm test`                         | Full test suite (including AST seasonal column reads guard and mapper unit tests)    | Passed |
| **Linter**              | `npm run lint`                     | ESLint rules across all files                                                        | Passed |
| **Production Build**    | `npm run build`                    | Next.js production bundle compilation                                                | Passed |
| **Drizzle Checks**      | `npx drizzle-kit check`            | Drizzle migration journal and schema sync (0000 - 0015)                              | Passed |
| **Schema Audit**        | `npm run db:audit:schema:metadata` | Schema metadata audit across 37 tables                                               | Passed |
| **Git Diff Check**      | `git diff --check`                 | Trailing whitespace and merge artifacts check                                        | Clean  |
| **E2E & PostgreSQL**    | `npm run test:e2e:local`           | Real isolated PostgreSQL: upgrade rehearsal + 12 DB integrity checks + Playwright UI | Passed |
