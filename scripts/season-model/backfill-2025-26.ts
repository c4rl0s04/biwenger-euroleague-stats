import type pg from 'pg';

export interface BackfillSummary {
  seasonId: string;
  playerSeasonsCount: number;
  teamSeasonsCount: number;
}

export interface ClientLike {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number | null }>;
}

/**
 * Reusable, canonical, idempotent backfill procedure for the 2025-26 season baseline.
 * Copies all 14 legacy seasonal player attributes from `players` into `player_seasons`,
 * and all 4 legacy seasonal team attributes (plus name/img metadata) from `teams` into `team_seasons`.
 *
 * Can be run multiple times safely (idempotent: A = B).
 */
export async function runCanonicalBackfill(
  client: ClientLike,
  seasonId: string = '2025-26'
): Promise<BackfillSummary> {
  // 1. Ensure target season exists
  const seasonCheck = await client.query('SELECT id FROM seasons WHERE id = $1', [seasonId]);
  if (seasonCheck.rows.length === 0) {
    throw new Error(`Season "${seasonId}" does not exist in seasons table.`);
  }

  // 2. Canonical backfill into team_seasons
  await client.query(
    `
    INSERT INTO team_seasons (
      season_id,
      team_id,
      name,
      short_name,
      img,
      city,
      arena_name,
      latitude,
      longitude,
      snapshot_source
    )
    SELECT
      $1,
      t.id,
      t.name,
      t.short_name,
      t.img,
      t.city,
      t.arena_name,
      t.latitude,
      t.longitude,
      'legacy_snapshot_2025_26'
    FROM teams t
    WHERE EXISTS (
      SELECT 1 FROM matches m
      WHERE m.season_id = $1
        AND (m.home_id = t.id OR m.away_id = t.id)
    )
    OR EXISTS (
      SELECT 1 FROM players p
      WHERE p.team_id = t.id
    )
    OR NOT EXISTS (
      SELECT 1 FROM matches WHERE season_id = $1
    )
    ON CONFLICT (season_id, team_id) DO UPDATE SET
      name = EXCLUDED.name,
      short_name = EXCLUDED.short_name,
      img = EXCLUDED.img,
      city = EXCLUDED.city,
      arena_name = EXCLUDED.arena_name,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      snapshot_source = COALESCE(team_seasons.snapshot_source, EXCLUDED.snapshot_source),
      updated_at = now()
    `,
    [seasonId]
  );

  // 3. Canonical backfill into player_seasons
  await client.query(
    `
    INSERT INTO player_seasons (
      season_id,
      player_id,
      team_id,
      owner_id,
      position,
      puntos,
      partidos_jugados,
      played_home,
      played_away,
      points_home,
      points_away,
      points_last_season,
      status,
      price_increment,
      price,
      dorsal,
      roster_snapshot_source
    )
    SELECT
      $1,
      p.id,
      p.team_id,
      p.owner_id,
      p.position,
      p.puntos,
      p.partidos_jugados,
      p.played_home,
      p.played_away,
      p.points_home,
      p.points_away,
      p.points_last_season,
      p.status,
      p.price_increment,
      p.price,
      p.dorsal,
      'legacy_snapshot_2025_26'
    FROM players p
    ON CONFLICT (season_id, player_id) DO UPDATE SET
      team_id = EXCLUDED.team_id,
      owner_id = EXCLUDED.owner_id,
      position = EXCLUDED.position,
      puntos = EXCLUDED.puntos,
      partidos_jugados = EXCLUDED.partidos_jugados,
      played_home = EXCLUDED.played_home,
      played_away = EXCLUDED.played_away,
      points_home = EXCLUDED.points_home,
      points_away = EXCLUDED.points_away,
      points_last_season = EXCLUDED.points_last_season,
      status = EXCLUDED.status,
      price_increment = EXCLUDED.price_increment,
      price = EXCLUDED.price,
      dorsal = EXCLUDED.dorsal,
      roster_snapshot_source = COALESCE(player_seasons.roster_snapshot_source, EXCLUDED.roster_snapshot_source),
      updated_at = now()
    `,
    [seasonId]
  );

  const teamCountRes = await client.query(
    'SELECT COUNT(*)::int AS count FROM team_seasons WHERE season_id = $1',
    [seasonId]
  );
  const playerCountRes = await client.query(
    'SELECT COUNT(*)::int AS count FROM player_seasons WHERE season_id = $1',
    [seasonId]
  );

  return {
    seasonId,
    teamSeasonsCount: teamCountRes.rows[0]?.count ?? 0,
    playerSeasonsCount: playerCountRes.rows[0]?.count ?? 0,
  };
}

// CLI runner if invoked directly
if (process.argv[1] && process.argv[1].endsWith('backfill-2025-26.ts')) {
  const { default: pg } = await import('pg');
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is required to run canonical backfill.');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const summary = await runCanonicalBackfill(client, '2025-26');
    console.log(
      `✅ Canonical 2025-26 backfill complete: ${summary.playerSeasonsCount} players, ${summary.teamSeasonsCount} teams.`
    );
  } catch (err) {
    console.error('❌ Canonical backfill failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}
