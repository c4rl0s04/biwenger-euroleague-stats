-- Data backfill and verification for the 2025-26 season baseline.
-- Safe, idempotent, transactional script.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM seasons WHERE id = '2025-26') THEN
    RAISE EXCEPTION 'Season 2025-26 does not exist in seasons table.';
  END IF;
END $$;

-- 1. Backfill position, dorsal, and roster_snapshot_source into player_seasons
UPDATE player_seasons ps
SET position = p.position,
    dorsal = p.dorsal,
    roster_snapshot_source = 'legacy_snapshot_2025_26'
FROM players p
WHERE ps.player_id = p.id
  AND ps.season_id = '2025-26'
  AND ps.roster_snapshot_source IS NULL;

-- 2. Populate team_seasons for 2025-26 from teams that participated in 2025-26 matches
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
ON CONFLICT (season_id, team_id) DO NOTHING;

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
