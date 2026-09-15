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
2. **Dedicated migration & validation tooling** (`npm run db:migrate` and `npm run db:validate`) allows operators to inspect and execute migrations safely.
3. **Zero stale column references** exist across all queries, services, and mappers, protected by a continuous AST architectural guard.
4. **Biwenger catalog & mutations** maintain authoritative current-season player updates, allowing downward score corrections, transfers, and valid zero-point values without artificial `GREATEST(...)` clamps.
5. **Official EuroLeague provider sync** preserves nullable sporting metrics, distinguishing between 0, valid absence (`null`), and non-participation (DNP).
6. **Round integrity invariant** enforces at most one match per team per fantasy round.
7. **Player mapping resolution** automatically re-triggers ingestion on unchanged payload checksums when unpersisted mapped player stats are detected, even when fantasy points already exist.
8. **Fail-closed season guard** prevents syncing when official EuroLeague provider bindings are missing, eliminating hardcoded fallbacks.
9. **Multi-season integrity validation** (`scripts/e2e/season-integrity.ts`) verifies that post-0015 multi-season databases maintain cross-season isolation, data integrity, and strict absence of deprecated seasonal columns.

---

## 2. Issues Addressed and Architectural Fixes

### 2.1 Sole Schema Authority (No Runtime DDL) & Tooling

- **Problem**: Runtime `ensureSchema()` calls attempted ad-hoc `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` statements during sync operations, conflicting with Drizzle migrations. In addition, catalog queries in `validateSchemaReady()` quoted `"public"` as an identifier rather than a literal string (`'public'`), causing silent check mismatches.
- **Fix**:
  - Removed deprecated `ensureSchema()`, eliminating all DDL from runtime code, and renamed to `src/lib/db/schema-validation.ts`.
  - Fixed schema name quoting (`'public'`) in `validateSchemaReady()`.
  - Added read-only verification in `validateSchemaReady()` for the absence of all 18 dropped seasonal columns and the presence of required EuroLeague columns (`is_dnp`, `official_game_code`, `arena_code`, `arena_name`, `arena_capacity`).
  - Implemented `npm run db:migrate` (`scripts/db/migrate.ts`) to run committed Drizzle migrations safely in journal order within transactions.
  - Implemented `npm run db:validate` (`scripts/db/validate.ts`) to run read-only preflight verification before sync or application start.

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

## 3. Database Support Model & Operational Lifecycle

### 3.1 Supported Environments

- **Existing Databases**: Must be on the current migration history (post-0015). Upgrading a populated database whose migration state is older than `0014` is **no longer supported** (all historical pre-0014 backfill and temporary check tooling has been decommissioned).
- **Fresh Databases**: Fully supported. A clean database executes migrations `0000` through `0015` in sequential order via `npm run db:migrate`.

### 3.2 Routine Migration & Verification Procedure

For applying pending schema updates and verifying database readiness:

```text
[Step 1: Apply Pending Migrations: npm run db:migrate]
         │
         ▼
[Step 2: Validate Schema Readiness: npm run db:validate]
         │
         ▼
[Step 3: Check Diagnostic Status: npm run db:check]
```

1. **Apply Migrations**:

   ```bash
   npm run db:migrate
   ```

   Applies any pending Drizzle migrations in journal order within transactions.

2. **Verify Schema Readiness**:

   ```bash
   npm run db:validate
   ```

   Runs standalone read-only schema preflight, confirming all required tables, seasonal isolation structures, and EuroLeague sporting columns (`is_dnp`, `official_game_code`, `arena_code`, `arena_name`, `arena_capacity`) are intact.

3. **Check Diagnostic Status**:
   ```bash
   npm run db:check
   ```
   Performs connection, ORM, schema readiness, and table count diagnostic verification.

---

## 4. Production Cutover & Schema Parity Status

- **Live Production Database**: The live Supabase production database has completed all migrations through `0015_dnp_provenance_and_match_venues.sql`.
  - All 366 current players have a matching `2025-26` `player_seasons` record.
  - All 20 current teams have a matching `2025-26` `team_seasons` record.
  - Zero players or teams are missing their seasonal snapshot.
  - All 18 deprecated columns on `players` and `teams` are absent.
  - Abandoned staging tables (`official_games`, `official_player_game_stats`) do not exist.
  - Migration journals (`drizzle.__drizzle_migrations` and `supabase_migrations.schema_migrations`) are 100% reconciled.
- **Codebase & Architecture**: Zero stale column reads, sole DDL authority established, continuous AST guards active, and all unit/integration tests passing.
- **Multi-Season Integrity**: Verified through `scripts/e2e/season-integrity.ts`.

---

## 5. Verification Suite

All modifications are verified through the repository's verification pipeline:

| Gate                    | Command                            | Scope / Coverage                                                                  | Result |
| :---------------------- | :--------------------------------- | :-------------------------------------------------------------------------------- | :----- |
| **Typecheck**           | `npm run typecheck`                | Full repository TypeScript compilation                                            | Passed |
| **Unit & Architecture** | `npm test`                         | Full test suite (including AST seasonal column reads guard and mapper unit tests) | Passed |
| **Linter**              | `npm run lint`                     | ESLint rules across all files                                                     | Passed |
| **Production Build**    | `npm run build`                    | Next.js production bundle compilation                                             | Passed |
| **Drizzle Checks**      | `npx drizzle-kit check`            | Drizzle migration journal and schema sync (0000 - 0015)                           | Passed |
| **Schema Audit**        | `npm run db:audit:schema:metadata` | Schema metadata audit across 37 tables                                            | Passed |
| **Git Diff Check**      | `git diff --check`                 | Trailing whitespace and merge artifacts check                                     | Clean  |
| **E2E & PostgreSQL**    | `npm run test:e2e:local`           | Real isolated PostgreSQL: 12 DB multi-season integrity checks + Playwright UI     | Passed |
