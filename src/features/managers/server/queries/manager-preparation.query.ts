import 'server-only';
import { pool as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export interface CaptainCandidateRow {
  player_id: number;
  name: string;
  position: string | null;
  team_id: number | null;
  team: string | null;
}

export interface AlertGainerRow {
  name: string;
  price_increment: string | number;
}

export interface AlertLoserRow {
  name: string;
  price_increment: string | number;
}

export interface AlertGoodFormRow {
  name: string;
  fantasy_points: number;
}

export interface ManagerAlertsRawData {
  priceGains: AlertGainerRow[];
  priceLosses: AlertLoserRow[];
  goodForm: AlertGoodFormRow | null;
}

export const resolveManagerPreparationSeason = resolveReadSeasonId;

export async function readCaptainCandidates(
  userId: string | number,
  seasonId: string
): Promise<CaptainCandidateRow[]> {
  const query = `
    SELECT 
      p.id as player_id,
      p.name,
      ps.position,
      ps.team_id as team_id,
      t.name as team
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2
  `;

  const result = await (pgClient as any).query(query, [seasonId, userId]);
  return result.rows;
}

export async function readManagerAlertsRaw(
  userId: string | number,
  seasonId: string
): Promise<ManagerAlertsRawData> {
  const priceGainsQuery = `
    SELECT 
      p.name,
      ps.price_increment AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND ps.price_increment > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const gainsResult = await (pgClient as any).query(priceGainsQuery, [seasonId, userId]);

  const priceLossesQuery = `
    SELECT 
      p.name,
      ps.price_increment AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND ps.price_increment < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
  const lossesResult = await (pgClient as any).query(priceLossesQuery, [seasonId, userId]);

  const recentGoodFormQuery = `
    WITH LastRound AS (
      SELECT MAX(round_id) as max_round
      FROM player_round_stats
      WHERE season_id = $1
    )
    SELECT 
      p.name,
      prs.fantasy_points
    FROM player_round_stats prs
    JOIN players p ON prs.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = prs.season_id
    WHERE prs.season_id = $1
      AND ps.owner_id = $2
      AND prs.round_id = (SELECT max_round FROM LastRound)
      AND prs.fantasy_points >= 25
    ORDER BY prs.fantasy_points DESC
    LIMIT 1
  `;
  const goodFormResult = await (pgClient as any).query(recentGoodFormQuery, [seasonId, userId]);

  return {
    priceGains: gainsResult.rows,
    priceLosses: lossesResult.rows,
    goodForm: goodFormResult.rows[0] ?? null,
  };
}
