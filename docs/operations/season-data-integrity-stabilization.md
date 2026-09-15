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

The multi-season model separates global identities (`players`, `teams`, `users`) from season-specific facts and performance (`player_seasons`, `team_seasons`, `user_seasons`, `player_round_stats`, `matches`). Migration `0014_drop_redundant_seasonal_columns.sql` removed historical duplicate columns from global `players` and `teams`. This stabilization ensures that:

1. **Drizzle migrations** remain the sole authority for database schema (no runtime DDL / `ensureSchema()` bootstrapping).
2. **Zero stale column references** exist across all queries, services, and mappers, protected by a continuous AST architectural guard.
3. **Biwenger catalog & mutations** maintain authoritative current-season player updates, allowing downward score corrections, transfers, and valid zero-point values without artificial `GREATEST(...)` clamps.
4. **Official EuroLeague provider sync** preserves nullable sporting metrics, distinguishing between 0, valid absence (`null`), and non-participation (DNP).
5. **Round integrity invariant** enforces at most one match per team per fantasy round.
6. **Player mapping resolution** automatically re-triggers ingestion on unchanged payload checksums when unpersisted mapped player stats are detected.
7. **Fail-closed season guard** prevents syncing when official EuroLeague provider bindings are missing, eliminating hardcoded fallbacks.

---

## 2. Issues Addressed and Architectural Fixes

### 2.1 Sole Schema Authority (No Runtime DDL)

- **Problem**: Runtime `ensureSchema()` calls attempted ad-hoc `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` statements during sync operations, conflicting with Drizzle migrations.
- **Fix**: Removed raw DDL and `ensureSchema()` invocation from `src/lib/sync/manager.ts`. Deprecated `ensureSchema` and updated `validateSchemaReady()` in `src/lib/db/schema_init.ts` to strictly inspect canonical tables (`seasons`, `players`, `teams`, `team_seasons`, `users`).

### 2.2 Complete Elimination of Dropped Seasonal Columns

- **Problem**: Queries and services across features retained fallback reads such as `COALESCE(ps.team_id, p.team_id)` or selected dropped global columns (`p.puntos`, `p.price`, `t.city`, `t.arena_name`), which fail in production once migration 0014 runs.
- **Fix**:
  - Updated all feature queries in `features/teams`, `features/managers`, `features/search`, `features/players`, `features/rounds`, `features/standings`, `lib/db/queries`, and `lib/services` to read strictly from `team_seasons` (`ts.*`) and `player_seasons` (`ps.*`).
  - Implemented continuous AST architectural guard `src/tests/architecture/seasonal-column-reads.test.ts` that parses all TypeScript files in `src/` to ensure no dropped column identifiers are selected or referenced on `players` or `teams`.

### 2.3 Authoritative Player Mutations & Catalog Semantics

- **Problem**: `upsertPlayer` in `src/lib/db/mutations/players.ts` used `GREATEST(...)` for points, price, and games played, preventing downward provider corrections and corrupting valid 0 scores. It also omitted `team_id = EXCLUDED.team_id`, causing mid-season transfers to fail to update the current season.
- **Fix**:
  - Updated `upsertPlayer` to directly set `team_id = EXCLUDED.team_id` and assign `puntos = EXCLUDED.puntos`, `partidos_jugados = EXCLUDED.partidos_jugados`, `price = EXCLUDED.price`.
  - Removed artificial points override heuristic in `src/lib/sync/services/biwenger/catalog.ts`. Valid 0 points from Biwenger are preserved authoritatively.

### 2.4 Nullable Sporting Metrics and DNP Preservation

- **Problem**: Sporting statistics (`minutes`, `points`, `rebounds`, `assists`, `fouls`) coerced absent values or empty strings to `0`, conflating a player who played 0 minutes with an absent stat, and losing DNP status.
- **Fix**:
  - Updated `EuroleaguePlayerBoxScore` types to allow `number | null` on all sporting fields, adding `isDnp: boolean`.
  - Implemented strict parser `parseMinutes` in `EuroleagueAdvancedClient`: parses `'MM:SS'` to total seconds, `'DNP'` to `isDnp: true` with `null` seconds, empty strings to `null`, and rejects invalid formats.
  - Implemented `parseProviderNumber`: preserves `0` as `0`, null/empty as `null`, and throws on malformed non-numeric values.
  - Updated `persistGameData` to write `Math.round(minutesSeconds / 60)` or `null`, and `isStarter` as `1`, `0`, or `null`.
  - Updated player profile models and mappers to propagate nullable metrics cleanly without arithmetic bugs.

### 2.5 One-Match-Per-Team-Per-Round Invariant

- **Problem**: In fantasy basketball, a team can only play once per round. Corrupted provider fixtures with duplicated teams could corrupt standings and round stats.
- **Fix**:
  - Added preflight validation in `src/lib/sync/services/biwenger/matches.ts` throwing an invariant violation if any team appears in multiple matches for the same round.
  - Added duplicate detection in `upsertMatch` in `src/lib/db/mutations/matches.ts`.

### 2.6 Unresolved Player Mapping Retry on Checksum Match

- **Problem**: If an official EuroLeague game was ingested before a player was mapped to a Biwenger player ID, their boxscore was omitted. Subsequent syncs skipped the game because the payload checksum had not changed.
- **Fix**:
  - Added `hasUnpersistedMappedPlayers(roundId, playerCodes)` in `src/lib/db/mutations/official/game-data.ts`.
  - In `src/lib/sync/services/euroleague/games.ts`, if the checksum matches, `hasUnpersistedMappedPlayers` checks if any mapped player lacks stats in `player_round_stats`. If found, `persistGameData` is re-run to persist the newly resolved player stats.

### 2.7 Fail-Closed Season Guard

- **Problem**: `assertSyncSeasonWritable` in `src/lib/sync/season-guard.ts` fell back to `'E2026'` when `euroleague_code` was missing from the seasons table, risking corrupting future seasons with the 2025-26 EuroLeague competition.
- **Fix**:
  - Removed `'E2026'` fallback.
  - Missing `euroleague_code` now throws `SEASON_EUROLEAGUE_CODE_MISSING` fail-closed error.

---

## 3. Safe Upgrade Runbook for Existing Databases

When upgrading existing environments to schema migration 0014:

```text
[Existing DB: 0001 - 0012]
         │
         ▼
[Apply Migration 0013: lifecycle columns & constraints]
         │
         ▼
[Verify Pre-Drop Data Integrity: player_seasons & team_seasons backfilled]
         │
         ▼
[Apply Migration 0014: drop deprecated seasonal columns from players & teams]
         │
         ▼
[Validate Schema Readiness: validateSchemaReady()]
```

### Step 1: Pre-Migration Backup

Before running schema migrations:

```bash
pg_dump -Fc --no-acl --no-owner "$DATABASE_URL" > "backup_pre_0014_$(date +%Y%m%d_%H%M%S).dump"
```

### Step 2: Apply Migrations Through 0013

Ensure schema lifecycle and seasonal tables are present:

```bash
npm run db:migrate
```

### Step 3: Verify Data Backfill Completeness

Execute this verification query before dropping columns:

```sql
-- Ensure all players have current season player_seasons entries
SELECT count(*) AS unmigrated_players
FROM players p
LEFT JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = (SELECT id FROM seasons WHERE status = 'active' LIMIT 1)
WHERE ps.player_id IS NULL;

-- Ensure all teams have current season team_seasons entries
SELECT count(*) AS unmigrated_teams
FROM teams t
LEFT JOIN team_seasons ts ON ts.team_id = t.id AND ts.season_id = (SELECT id FROM seasons WHERE status = 'active' LIMIT 1)
WHERE ts.team_id IS NULL;
```

Both counts must be `0` before proceeding to Step 4.

### Step 4: Apply Migration 0014

Apply `drizzle/0014_drop_redundant_seasonal_columns.sql` to drop deprecated columns (`position`, `puntos`, `partidos_jugados`, `price`, `team_id`, `status`, `price_increment` on `players`; `city`, `arena_name`, `latitude`, `longitude` on `teams`).

### Step 5: Verify Schema Readiness

Run application schema validation:

```bash
node -e "import('./src/lib/db/schema_init.ts').then(m => m.validateSchemaReady()).then(() => console.log('Schema ready')).catch(err => { console.error(err); process.exit(1); })"
```

---

## 4. Verification Suite

All modifications are verified through the repository's verification pipeline:

| Gate                    | Command                  | Scope / Coverage                                                                  | Result |
| :---------------------- | :----------------------- | :-------------------------------------------------------------------------------- | :----- |
| **Typecheck**           | `npm run typecheck`      | Full repository TypeScript compilation                                            | Passed |
| **Unit & Architecture** | `npm test`               | 1,357 tests across 197 test files (including AST column reads guard)              | Passed |
| **Linter**              | `npm run lint`           | ESLint rules across all files                                                     | Passed |
| **Production Build**    | `npm run build`          | Next.js production bundle compilation                                             | Passed |
| **Drizzle Checks**      | `npx drizzle-kit check`  | Drizzle migration journal and schema sync                                         | Passed |
| **Git Diff Check**      | `git diff --check`       | Trailing whitespace and merge artifacts check                                     | Clean  |
| **E2E & PostgreSQL**    | `npm run test:e2e:local` | Real isolated PostgreSQL cluster: 12 DB multi-season checks + Playwright UI suite | Passed |
