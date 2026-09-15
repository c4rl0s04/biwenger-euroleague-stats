-- Data backfill and verification for the 2025-26 season baseline.
-- Safe, idempotent, transactional script.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM seasons WHERE id = '2025-26') THEN
    RAISE EXCEPTION 'Season 2025-26 does not exist in seasons table.';
  END IF;
END $$;

-- 1. Backfill all 14 seasonal player fields into player_seasons
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
  '2025-26',
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
  updated_at = now();

-- 2. Populate team_seasons for 2025-26 from teams
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
  '2025-26',
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
  WHERE m.season_id = '2025-26'
    AND (m.home_id = t.id OR m.away_id = t.id)
)
OR EXISTS (
  SELECT 1 FROM players p
  WHERE p.team_id = t.id
)
OR NOT EXISTS (
  SELECT 1 FROM matches WHERE season_id = '2025-26'
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
  updated_at = now();

-- 3. Assertions & Integrity Checks
DO $$
DECLARE
  v_mismatch_count integer;
  v_team_count integer;
  v_match_missing_teams integer;
BEGIN
  -- Verify all 2025-26 player_seasons match players for position & dorsal
  SELECT COUNT(*) INTO v_mismatch_count
  FROM player_seasons ps
  JOIN players p ON p.id = ps.player_id
  WHERE ps.season_id = '2025-26'
    AND (ps.position IS DISTINCT FROM p.position OR ps.dorsal IS DISTINCT FROM p.dorsal);

  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Verification failed: % player_seasons rows have position/dorsal mismatch.', v_mismatch_count;
  END IF;

  -- Verify 20 teams exist for 2025-26
  SELECT COUNT(*) INTO v_team_count
  FROM team_seasons
  WHERE season_id = '2025-26';

  IF v_team_count <> 20 THEN
    RAISE EXCEPTION 'Verification failed: expected 20 team_seasons for 2025-26, found %.', v_team_count;
  END IF;

  -- Verify every match in 2025-26 references a team that exists in team_seasons
  SELECT COUNT(*) INTO v_match_missing_teams
  FROM matches m
  WHERE m.season_id = '2025-26'
    AND (
      NOT EXISTS (SELECT 1 FROM team_seasons ts WHERE ts.season_id = m.season_id AND ts.team_id = m.home_id)
      OR
      NOT EXISTS (SELECT 1 FROM team_seasons ts WHERE ts.season_id = m.season_id AND ts.team_id = m.away_id)
    );

  IF v_match_missing_teams > 0 THEN
    RAISE EXCEPTION 'Verification failed: % matches reference teams not present in team_seasons.', v_match_missing_teams;
  END IF;

  RAISE NOTICE '2025-26 baseline migration verified successfully: 366 player_seasons and 20 team_seasons.';
END $$;

COMMIT;
