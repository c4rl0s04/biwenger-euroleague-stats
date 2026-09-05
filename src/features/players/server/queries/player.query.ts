import 'server-only';

import { CONFIG } from '@/lib/config';
import { db as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { getPlayerFormMap } from '@/lib/db/queries/core/playerForm';

export interface CorePlayer {
  id: number | string;
  name: string | null;
  img: string | null;
  position: string | null;
  price: number | string | null;
  price_increment?: number | string | null;
  team_id: number | string | null;
  team_name: string | null;
  team_short_name?: string | null;
  team_code?: string | null;
  team_img?: string | null;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number | string | null;
  owner_icon?: string | null;
  points?: number | string | null;
  average?: number | string | null;
  recent_scores?: string | null;
  status?: string | null;
  total_points?: number | string | null;
  played?: number | string | null;
  best_score?: number | string | null;
  worst_score?: number | string | null;
}

export interface PlayerRecentForm extends CorePlayer {
  games_played: number | string;
  avg_points: number | string;
  total_points: number | string;
  recent_scores: string;
  season_avg?: number | string;
  avg_diff?: number | string;
  trend_pct?: number | string;
  games?: number | string; // Alias for games_played in some queries
  recent_avg?: number | string; // Alias for avg_points in some queries
}

export interface RisingStar extends CorePlayer {
  recent_avg: number | string;
  earlier_avg: number | string;
  improvement: number | string;
  improvement_pct: number | string;
}

export interface PlayerBirthdayRow {
  id: number | string;
  name: string | null;
  team_id: number | string | null;
  team_name: string | null;
  team_code: string | null;
  position: string | null;
  birth_date: Date | string | null;
  owner_name: string | null;
  owner_color_index: number | string | null;
}

export interface PlayerStatLeader {
  player_id: number;
  name: string;
  team_id: number | null;
  team_name: string;
  team_code: string;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
  value: number;
  games_played: number | string;
  avg_value: number;
}

export interface PlayerDetailsRow extends CorePlayer {
  puntos: number | string | null;
  partidos_jugados: number | string | null;
  played_home: number | string | null;
  played_away: number | string | null;
  points_home: number | string | null;
  points_away: number | string | null;
  points_last_season: number | string | null;
  birth_date: Date | string | null;
  height: number | string | null;
  weight: number | string | null;
  euroleague_code: string | null;
  dorsal: string | null;
  country: string | null;
  profile_url: string | null;
  games_played: number | string;
  season_avg: number | string | null;
  total_points: number | string | null;
  best_real_points: number | string | null;
  worst_real_points: number | string | null;
  best_fantasy: number | string | null;
  worst_fantasy: number | string | null;
}

export interface PlayerMatchRow {
  round_id: number | string | null;
  round_name: string | null;
  match_date: Date | string | null;
  home_team: string | null;
  home_img: string | null;
  away_team: string | null;
  away_img: string | null;
  home_id: number | string | null;
  away_id: number | string | null;
  home_score: number | string | null;
  away_score: number | string | null;
  fantasy_points: number | string | null;
  minutes_played: number | string | null;
  points_scored: number | string | null;
  rebounds: number | string | null;
  assists: number | string | null;
  steals: number | string | null;
  blocks: number | string | null;
  turnovers: number | string | null;
  two_points_made: number | string | null;
  two_points_attempted: number | string | null;
  three_points_made: number | string | null;
  three_points_attempted: number | string | null;
  free_throws_made: number | string | null;
  free_throws_attempted: number | string | null;
  fouls_committed: number | string | null;
  valuation: number | string | null;
}

export interface PlayerDetailsQueryResult {
  player: PlayerDetailsRow;
  recentMatches: PlayerMatchRow[];
  priceHistory: PlayerPriceHistoryRow[];
  transfers: PlayerTransferRow[];
  playerTotalMatches: number;
}

export interface PlayerPriceHistoryRow {
  date: Date | string;
  price: number | string;
}

export interface PlayerTransferRow {
  date: Date | string;
  from_name: string | null;
  to_name: string | null;
  amount: number | string | null;
  from_img: string | null;
  to_img: string | null;
  from_color: number | string | null;
  to_color: number | string | null;
  from_id: number | string | null;
  to_id: number | string | null;
}

async function listPlayerPriceHistory(playerId: number): Promise<PlayerPriceHistoryRow[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT date, price
    FROM market_values
    WHERE season_id = $2 AND player_id = $1
    ORDER BY date ASC
  `;
  return (await pgClient.query(query, [playerId, seasonId])).rows as PlayerPriceHistoryRow[];
}

async function listPlayerTransfers(playerId: number): Promise<PlayerTransferRow[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT
      f.fecha as date,
      f.vendedor as from_name,
      f.comprador as to_name,
      f.precio as amount,
      u1.icon as from_img,
      u2.icon as to_img,
      u1.color_index as from_color,
      u2.color_index as to_color,
      u1.id as from_id,
      u2.id as to_id
    FROM fichajes f
    LEFT JOIN users u1 ON f.vendedor = u1.name
    LEFT JOIN users u2 ON f.comprador = u2.name
    WHERE f.season_id = $2 AND f.player_id = $1
    ORDER BY f.timestamp DESC
  `;
  const transfers = (await pgClient.query(query, [playerId, seasonId])).rows as PlayerTransferRow[];
  const initialOwnerQuery = `
    SELECT
      u.id as user_id, u.name as owner_name, u.color_index as owner_color_index,
      u.icon as owner_img
    FROM initial_squads s
    JOIN users u ON s.user_id = u.id
    WHERE s.season_id = $2 AND s.player_id = $1
  `;
  const initialOwner = (await pgClient.query(initialOwnerQuery, [playerId, seasonId])).rows[0] as
    | {
        user_id: number | string;
        owner_name: string;
        owner_color_index: number | string | null;
        owner_img: string | null;
      }
    | undefined;

  if (initialOwner) {
    let initialDate = new Date().toISOString();
    const configuredStartDate = CONFIG.SEASON.START_DATE;
    if (configuredStartDate) {
      const configured = new Date(configuredStartDate);
      if (!Number.isNaN(configured.getTime())) initialDate = configured.toISOString();
    }
    const oldestTransfer = transfers.at(-1);
    if (oldestTransfer?.date) {
      const date = new Date(oldestTransfer.date);
      if (!Number.isNaN(date.getTime())) {
        date.setHours(date.getHours() - 24);
        initialDate = date.toISOString();
      }
    }
    transfers.push({
      date: initialDate,
      from_name: 'Biwenger',
      to_name: initialOwner.owner_name,
      amount: 0,
      from_img: null,
      to_img: initialOwner.owner_img,
      from_color: null,
      to_color: initialOwner.owner_color_index,
      from_id: null,
      to_id: initialOwner.user_id,
    });
  }
  return transfers;
}

/**
 * Get total matches played by a player (minutes > 0) in the current season
 */
export async function getPlayerMatchesPlayed(playerId: number | string): Promise<number> {
  const numericPlayerId = Number(playerId);
  if (isNaN(numericPlayerId)) return 0;
  const seasonId = await resolveReadSeasonId();

  const query = `
    SELECT COUNT(DISTINCT round_id) as count
    FROM player_round_stats
    WHERE season_id = $2 AND player_id = $1 AND minutes > 0
  `;

  const res = await pgClient.query(query, [numericPlayerId, seasonId]);
  return parseInt(res.rows[0]?.count || '0', 10);
}

/**
 * Get top performing players
 */
export async function getTopPlayers(limit: number = 6): Promise<CorePlayer[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      p.id, p.name, COALESCE(opm.image_url,p.img) AS img, t.id as team_id, t.name as team_name,
        COALESCE(otm.provider_team_code,t.code) as team_code, p.position, COALESCE(ps.price, p.price) as price,
      COALESCE(ps.puntos, p.puntos) as points,
      ROUND(CAST(COALESCE(ps.puntos, p.puntos) AS NUMERIC) / NULLIF(COALESCE(ps.partidos_jugados, p.partidos_jugados), 0), 1) as average,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN official_player_mappings opm
      ON opm.player_id=p.id AND opm.season_id=ps.season_id
     AND opm.provider='euroleague_advanced' AND opm.status='matched'
    LEFT JOIN official_team_mappings otm
      ON otm.team_id=t.id AND otm.season_id=ps.season_id AND otm.provider='euroleague_advanced'
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    ORDER BY COALESCE(ps.puntos, p.puntos) DESC
    LIMIT $1
  `;

  const [rows, formMap] = await Promise.all([
    pgClient.query(query, [limit, seasonId]).then((result) => result.rows as CorePlayer[]),
    getPlayerFormMap(),
  ]);

  return rows.map((row) => ({
    ...row,
    average: parseFloat(String(row.average)) || 0,
    recent_scores: formMap.get(Number(row.id))?.recent_scores ?? null,
  }));
}

/**
 * Get top players by recent form (last N rounds)
 */
export async function getTopPlayersByForm(
  limit: number = 5,
  rounds: number = 3
): Promise<PlayerRecentForm[]> {
  const seasonId = await resolveReadSeasonId();
  // 1. Get the form map for everyone with the specified round window
  const formMap = await getPlayerFormMap(rounds);

  // 2. Identify the top players by form from the map
  const topFormEntries = Array.from(formMap.values())
    .sort((a, b) => b.avg_form_score - a.avg_form_score)
    .slice(0, limit * 2); // Fetch extra for safety

  if (topFormEntries.length === 0) return [];

  const playerIds = topFormEntries.map((e) => e.player_id);

  // 3. Fetch metadata for these specific players
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      COALESCE(opm.image_url,p.img) AS img,
      t.id as team_id,
      t.name as team_name,
      COALESCE(otm.provider_team_code,t.code) as team_code,
      COALESCE(otm.crest_url,t.img) as team_img,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index,
      COALESCE(pa.total_points, 0) as total_points,
      COALESCE(pa.played_count, 0) as games_played
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN official_player_mappings opm
      ON opm.player_id=p.id AND opm.season_id=ps.season_id
     AND opm.provider='euroleague_advanced' AND opm.status='matched'
    LEFT JOIN official_team_mappings otm
      ON otm.team_id=t.id AND otm.season_id=ps.season_id AND otm.provider='euroleague_advanced'
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    LEFT JOIN (
      SELECT player_id, SUM(fantasy_points) as total_points, COUNT(*) as played_count
      FROM player_round_stats
      WHERE season_id = $2
      GROUP BY player_id
    ) pa ON p.id = pa.player_id
    WHERE p.id = ANY($1)
  `;

  const rows = (await pgClient.query(query, [playerIds, seasonId])).rows as Array<
    CorePlayer & { total_points: number | string; games_played: number | string }
  >;

  // 4. Merge metadata with form data and sort final list
  return rows
    .map((row) => {
      const form = formMap.get(Number(row.id));
      return {
        ...row,
        id: Number(row.id),
        total_points: parseInt(String(row.total_points)) || 0,
        games_played: parseInt(String(row.games_played)) || 0,
        avg_points: form?.avg_form_score || 0,
        recent_scores: form?.recent_scores || '',
      };
    })
    .sort((a, b) => b.avg_points - a.avg_points)
    .slice(0, limit);
}

/**
 * Get detailed player information by ID
 */
export async function getPlayerDetails(
  playerId: number | string
): Promise<PlayerDetailsQueryResult | null> {
  const numericPlayerId = Number(playerId);
  if (isNaN(numericPlayerId)) return null;
  const seasonId = await resolveReadSeasonId();

  // 1. Base Player Info
  const query = `
    SELECT 
      p.*,
      COALESCE(opm.image_url,p.img) as img,
      COALESCE(ps.team_id, p.team_id) as team_id,
      COALESCE(ps.price, p.price) as price,
      COALESCE(ps.price_increment, p.price_increment) as price_increment,
      COALESCE(ps.puntos, p.puntos) as puntos,
      COALESCE(ps.partidos_jugados, p.partidos_jugados) as partidos_jugados,
      COALESCE(ps.status, p.status) as status,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index,
      COALESCE(us.icon, u.icon) as owner_icon,
      (SELECT COUNT(*) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as games_played,
      (SELECT ROUND(AVG(fantasy_points), 1) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as season_avg,
      (SELECT SUM(fantasy_points) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as total_points,
      (SELECT MAX(points) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as best_real_points,
      (SELECT MIN(points) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as worst_real_points,
      (SELECT MAX(fantasy_points) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as best_fantasy,
      (SELECT MIN(fantasy_points) FROM player_round_stats WHERE season_id = $2 AND player_id = p.id) as worst_fantasy,
      t.id as team_id,
      t.name as team_name,
      COALESCE(otm.crest_url,t.img) as team_img,
      COALESCE(otm.provider_team_code,t.code) as team_code
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN official_player_mappings opm
      ON opm.player_id=p.id AND opm.season_id=ps.season_id
     AND opm.provider='euroleague_advanced' AND opm.status='matched'
    LEFT JOIN official_team_mappings otm
      ON otm.team_id=t.id AND otm.season_id=ps.season_id AND otm.provider='euroleague_advanced'
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    WHERE p.id = $1
  `;

  const playerRes = await pgClient.query(query, [numericPlayerId, seasonId]);
  const player = playerRes.rows[0];

  if (!player) return null;

  // 2. Matches History
  const matchesQuery = `
    SELECT 
      m.round_id,
      m.round_name,
      m.date as match_date,
      th.name as home_team,
      COALESCE(hmap.crest_url,th.img) as home_img,
      ta.name as away_team,
      COALESCE(amap.crest_url,ta.img) as away_img,
      m.home_id,
      m.away_id,
      m.home_score,
      m.away_score,
      prs.fantasy_points,
      prs.minutes as minutes_played,
      prs.points as points_scored,
      prs.rebounds,
      prs.assists,
      prs.steals,
      prs.blocks,
      prs.turnovers,
      prs.two_points_made,
      prs.two_points_attempted,
      prs.three_points_made,
      prs.three_points_attempted,
      prs.free_throws_made,
      prs.free_throws_attempted,
      prs.fouls_committed,
      prs.valuation
    FROM matches m
    JOIN players p ON p.id = $1
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    LEFT JOIN official_team_mappings hmap
      ON hmap.team_id=th.id AND hmap.season_id=m.season_id AND hmap.provider='euroleague_advanced'
    LEFT JOIN official_team_mappings amap
      ON amap.team_id=ta.id AND amap.season_id=m.season_id AND amap.provider='euroleague_advanced'
    LEFT JOIN player_round_stats prs ON m.round_id = prs.round_id AND prs.player_id = p.id AND prs.season_id = m.season_id
    WHERE m.season_id = $2
      AND (m.home_id = COALESCE(ps.team_id, p.team_id) OR m.away_id = COALESCE(ps.team_id, p.team_id))
      AND m.date < NOW()
      AND m.round_id IN (SELECT DISTINCT round_id FROM player_round_stats WHERE season_id = $2)
    ORDER BY m.round_id DESC
  `;

  const recentMatches = (await pgClient.query(matchesQuery, [numericPlayerId, seasonId]))
    .rows as PlayerMatchRow[];

  const [priceHistory, transfers, playerTotalMatches] = await Promise.all([
    listPlayerPriceHistory(numericPlayerId),
    listPlayerTransfers(numericPlayerId),
    getPlayerMatchesPlayed(numericPlayerId),
  ]);

  return {
    player: player as PlayerDetailsRow,
    recentMatches,
    priceHistory,
    transfers,
    playerTotalMatches,
  };
}

/**
 * Get players with birthdays today
 */
export async function getPlayersBirthday(): Promise<PlayerBirthdayRow[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    SELECT 
      p.id,
      p.name,
      t.id as team_id,
      t.name as team_name,
        t.code as team_code,
      p.position,
      p.birth_date,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    WHERE p.birth_date IS NOT NULL
      AND TO_CHAR(CAST(p.birth_date AS DATE), 'MM-DD') = TO_CHAR(NOW(), 'MM-DD')
    ORDER BY p.name
  `;

  return (await pgClient.query(query, [seasonId])).rows as PlayerBirthdayRow[];
}

/**
 * Get players on hot or cold streaks
 */
export async function getPlayerStreaks(
  minGames: number = 3
): Promise<{ hot: PlayerRecentForm[]; cold: PlayerRecentForm[] }> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      WHERE season_id = $2
      ORDER BY round_id DESC
      LIMIT 5
    ),
    PlayerRecentForm AS (
      SELECT 
        prs.player_id as id,
        p.name,
        t.id as team_id,
        t.name as team_name,
        t.code as team_code,
        p.position,
        COUNT(*) as games,
        AVG(prs.fantasy_points) as recent_avg,
        ps.owner_id,
        COALESCE(us.name, u.name) as owner_name,
        COALESCE(us.color_index, u.color_index, 0) as owner_color_index
      FROM player_round_stats prs
      JOIN players p ON prs.player_id = p.id
      JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
      LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
      LEFT JOIN users u ON ps.owner_id = u.id
      LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
      WHERE prs.round_id IN (SELECT round_id FROM RecentRounds)
      AND prs.season_id = $2
      GROUP BY prs.player_id, p.name, t.id, t.name, p.position, ps.owner_id, us.name, u.name, us.color_index, u.color_index
      HAVING COUNT(*) >= $1
    ),
    SeasonAvg AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as season_avg
      FROM player_round_stats
      WHERE season_id = $2
      GROUP BY player_id
    )
    SELECT 
      prf.id,
      prf.name,
      prf.team_id,
      prf.team_name,
      prf.position,
      prf.games,
      prf.recent_avg,
      prf.owner_id,
      prf.owner_name,
      prf.owner_color_index,
      COALESCE(sa.season_avg, 0) as season_avg,
      ROUND(prf.recent_avg - COALESCE(sa.season_avg, 0), 1) as avg_diff,
      ROUND((prf.recent_avg - COALESCE(sa.season_avg, 0)) / NULLIF(sa.season_avg, 0) * 100, 1) as trend_pct
    FROM PlayerRecentForm prf
    LEFT JOIN SeasonAvg sa ON prf.id = sa.player_id
    ORDER BY ABS(prf.recent_avg - COALESCE(sa.season_avg, 0)) DESC
    LIMIT 20
  `;

  const allPlayers = (
    (await pgClient.query(query, [minGames, seasonId])).rows as PlayerRecentForm[]
  ).map((player) => ({
    ...player,
    recent_avg: parseFloat(String(player.recent_avg)) || 0,
    season_avg: parseFloat(String(player.season_avg)) || 0,
    avg_diff: parseFloat(String(player.avg_diff)) || 0,
    trend_pct: parseFloat(String(player.trend_pct)) || 0,
  }));

  return {
    hot: allPlayers.filter((player) => (player.trend_pct ?? 0) > 20).slice(0, 5),
    cold: allPlayers.filter((player) => (player.trend_pct ?? 0) < -20).slice(0, 5),
  };
}

/**
 * Get players showing improvement trend
 */
export async function getRisingStars(limit: number = 5): Promise<RisingStar[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH RecentRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      WHERE season_id = $2
      ORDER BY round_id DESC
      LIMIT 5
    ),
    EarlierRounds AS (
      SELECT DISTINCT round_id
      FROM player_round_stats
      WHERE season_id = $2 AND round_id NOT IN (SELECT round_id FROM RecentRounds)
      ORDER BY round_id DESC
      LIMIT 5
    ),
    RecentPerformance AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as recent_avg,
        COUNT(*) as recent_games
      FROM player_round_stats
      WHERE season_id = $2 AND round_id IN (SELECT round_id FROM RecentRounds)
      GROUP BY player_id
      HAVING COUNT(*) >= 3
    ),
    EarlierPerformance AS (
      SELECT 
        player_id,
        AVG(fantasy_points) as earlier_avg
      FROM player_round_stats
      WHERE season_id = $2 AND round_id IN (SELECT round_id FROM EarlierRounds)
      GROUP BY player_id
    )
    SELECT 
      p.id,
      p.name,
      t.id as team_id,
      t.name as team_name,
        t.code as team_code,
      p.position,
      rp.recent_avg,
      COALESCE(ep.earlier_avg, 0) as earlier_avg,
      ROUND(rp.recent_avg - COALESCE(ep.earlier_avg, 0), 1) as improvement,
      ROUND((rp.recent_avg - COALESCE(ep.earlier_avg, 0)) / NULLIF(ep.earlier_avg, 0) * 100, 1) as improvement_pct,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index
    FROM RecentPerformance rp
    JOIN players p ON rp.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $2
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN EarlierPerformance ep ON rp.player_id = ep.player_id
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    WHERE rp.recent_avg > COALESCE(ep.earlier_avg, 0)
      AND (rp.recent_avg - COALESCE(ep.earlier_avg, 0)) >= 3
    ORDER BY improvement DESC
    LIMIT $1
  `;

  return ((await pgClient.query(query, [limit, seasonId])).rows as RisingStar[]).map((row) => ({
    ...row,
    recent_avg: parseFloat(String(row.recent_avg)) || 0,
    earlier_avg: parseFloat(String(row.earlier_avg)) || 0,
    improvement: parseFloat(String(row.improvement)) || 0,
    improvement_pct: parseFloat(String(row.improvement_pct)) || 0,
  }));
}

/**
 * Get all players with basic stats for the players list
 */
export async function getAllPlayers(): Promise<CorePlayer[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
     WITH PlayerAggregates AS (
       SELECT 
         player_id,
         COUNT(*) as played_count,
         COALESCE(SUM(fantasy_points), 0) as total_points,
         ROUND(AVG(fantasy_points), 1) as calculated_avg,
         MAX(fantasy_points) as best_score,
         MIN(fantasy_points) as worst_score
       FROM player_round_stats
       WHERE season_id = $1
       GROUP BY player_id
     )
     SELECT 
       p.id,
       p.name,
       COALESCE(opm.image_url,p.img) AS img,
       p.position,
       COALESCE(ps.price, p.price) as price,
       COALESCE(ps.price_increment, p.price_increment) as price_increment,
       COALESCE(ps.team_id, p.team_id) as team_id,
       t.name as team_name,
       COALESCE(otm.provider_team_code,t.code) as team_code,
       t.short_name as team_short_name,
       COALESCE(otm.crest_url,t.img) as team_img,

       ps.owner_id,
       COALESCE(us.name, u.name) as owner_name,
       COALESCE(us.color_index, u.color_index, 0) as owner_color_index,
       COALESCE(us.icon, u.icon) as owner_icon,
       
       -- Use aggregated stats from player_round_stats as requested
       COALESCE(pa.total_points, 0) as total_points,
       COALESCE(pa.played_count, 0) as played,
       COALESCE(pa.calculated_avg, 0) as average,
       COALESCE(pa.best_score, 0) as best_score,
       COALESCE(pa.worst_score, 0) as worst_score,
       
       COALESCE(ps.status, p.status) as status
     FROM players p
     JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
     LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
     LEFT JOIN official_player_mappings opm
       ON opm.player_id=p.id AND opm.season_id=ps.season_id
      AND opm.provider='euroleague_advanced' AND opm.status='matched'
     LEFT JOIN official_team_mappings otm
       ON otm.team_id=t.id AND otm.season_id=ps.season_id AND otm.provider='euroleague_advanced'
     LEFT JOIN users u ON ps.owner_id = u.id
     LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
     LEFT JOIN PlayerAggregates pa ON p.id = pa.player_id
     ORDER BY COALESCE(pa.total_points, 0) DESC
  `;

  const [rows, formMap] = await Promise.all([
    pgClient.query(query, [seasonId]).then(
      (result) =>
        result.rows as Array<
          CorePlayer & {
            played: number | string;
            total_points: number | string;
            best_score: number | string;
            worst_score: number | string;
          }
        >
    ),
    getPlayerFormMap(),
  ]);

  return rows.map((player) => ({
    ...player,
    total_points: parseFloat(String(player.total_points)) || 0,
    played: parseInt(String(player.played)) || 0,
    average: parseFloat(String(player.average)) || 0,
    best_score: parseFloat(String(player.best_score)) || 0,
    worst_score: parseFloat(String(player.worst_score)) || 0,
    price: parseInt(String(player.price)) || 0,
    recent_scores: formMap.get(Number(player.id))?.recent_scores ?? null,
    avg_form_score: formMap.get(Number(player.id))?.avg_form_score ?? 0,
  }));
}

/**
 * Get stat leaders (Top 5)
 */
export async function getStatLeaders(type: string = 'points'): Promise<PlayerStatLeader[]> {
  const seasonId = await resolveReadSeasonId();
  const columnMap: Record<string, string> = {
    real_points: 'points',
    points: 'points',
    rebounds: 'rebounds',
    assists: 'assists',
    pir: 'valuation',
  };

  const column = columnMap[type] || 'points';

  // Sanitize column name to prevent SQL injection (though key is mapped above)
  const query = `
    SELECT 
      p.id as player_id,
      p.name,
      t.id as team_id,
      t.name as team_name,
        t.code as team_code,
      ps.owner_id,
      COALESCE(us.name, u.name) as owner_name,
      COALESCE(us.color_index, u.color_index, 0) as owner_color_index,
      SUM(prs.${column}) as value,
      COUNT(prs.id) as games_played,
      ROUND(AVG(prs.${column}), 1) as avg_value
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ps.season_id
    WHERE prs.season_id = $1
    GROUP BY p.id, p.name, t.id, t.name, ps.owner_id, us.name, u.name, us.color_index, u.color_index
    HAVING SUM(prs.${column}) > 0
    ORDER BY value DESC
    LIMIT 5
  `;

  try {
    return ((await pgClient.query(query, [seasonId])).rows as PlayerStatLeader[]).map((row) => ({
      ...row,
      value: parseFloat(String(row.value)) || 0,
      avg_value: parseFloat(String(row.avg_value)) || 0,
    }));
  } catch (error) {
    console.error('Error fetching stat leaders:', error);
    return [];
  }
}
