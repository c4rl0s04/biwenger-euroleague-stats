import 'server-only';
import { db as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export const resolveManagerPreparationSeason = resolveReadSeasonId;
export interface CaptainCandidateRow {
  player_id: number;
  name: string | null;
  position: string | null;
  team_id: number | null;
  team: string | null;
}
export interface PriceAlertRow {
  name: string | null;
  price_increment: string | number | null;
}
export interface PerformanceAlertRow {
  name: string | null;
  fantasy_points: string | number | null;
}
export interface ManagerAlertRows {
  gains: PriceAlertRow[];
  losses: PriceAlertRow[];
  goodForm: PerformanceAlertRow | undefined;
}
export async function readCaptainCandidates(
  userId: string | number,
  seasonId: string
): Promise<CaptainCandidateRow[]> {
  const squadQuery = `
    SELECT 
      p.id as player_id,
      p.name,
      p.position,
      COALESCE(ps.team_id, p.team_id) as team_id,
      t.name as team
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON COALESCE(ps.team_id, p.team_id) = t.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2
  `;
  return (await pgClient.query<CaptainCandidateRow>(squadQuery, [seasonId, userId])).rows;
}
export async function readManagerAlerts(userId: string | number): Promise<ManagerAlertRows> {
  const seasonId = await resolveReadSeasonId();
  const priceGainsQuery = `
    SELECT 
      p.name,
      COALESCE(ps.price_increment, p.price_increment) AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND COALESCE(ps.price_increment, p.price_increment) > 500000
    ORDER BY price_increment DESC
    LIMIT 2
  `;
  const priceLossesQuery = `
    SELECT 
      p.name,
      COALESCE(ps.price_increment, p.price_increment) AS price_increment
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.owner_id = $2 AND COALESCE(ps.price_increment, p.price_increment) < -500000
    ORDER BY price_increment ASC
    LIMIT 2
  `;
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
  const gains = (await pgClient.query<PriceAlertRow>(priceGainsQuery, [seasonId, userId])).rows;
  const losses = (await pgClient.query<PriceAlertRow>(priceLossesQuery, [seasonId, userId])).rows;
  const goodForm = (
    await pgClient.query<PerformanceAlertRow>(recentGoodFormQuery, [seasonId, userId])
  ).rows[0];
  return { gains, losses, goodForm };
}
