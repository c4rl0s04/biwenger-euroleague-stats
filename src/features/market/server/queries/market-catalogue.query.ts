import 'server-only';
import { pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { MarketOpportunityRecord, MarketListingRecord } from './market-catalogue.records';

export const resolveMarketCatalogueSeason = resolveReadSeasonId;

export async function readMarketOpportunityCandidates(
  seasonId: string
): Promise<MarketOpportunityRecord[]> {
  const query = `
    SELECT
      p.id as player_id,
      p.name,
      ps.position,
      t.id as team_id,
      t.name as team,
      ps.price as price,
      COALESCE(ps.price_increment, 0) as price_trend
    FROM player_seasons ps
    JOIN players p ON ps.player_id = p.id
    LEFT JOIN teams t ON ps.team_id = t.id
    WHERE ps.season_id = $1
      AND ps.owner_id IS NULL
      AND ps.price > 0
    ORDER BY COALESCE(ps.price_increment, 0) DESC
    LIMIT 100
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}

export async function readCurrentMarketListings(seasonId: string): Promise<MarketListingRecord[]> {
  const query = `
    WITH PlayerTotals AS (
      SELECT
        player_id,
        (SELECT COUNT(*) FROM player_round_stats WHERE season_id = $1 AND player_id = prs.player_id) as games_played,
        ROUND(AVG(fantasy_points), 1) as season_avg,
        SUM(fantasy_points) as total_points,
        MIN(fantasy_points) as min_points,
        MAX(fantasy_points) as max_points
      FROM player_round_stats prs
      WHERE season_id = $1
      GROUP BY player_id
    ),
    TeamNextMatch AS (
      SELECT
        team_id,
        opponent_id,
        opponent_name,
        opponent_img,
        date
      FROM (
        SELECT
          t.id as team_id,
          CASE WHEN m.home_id = t.id THEN m.away_id ELSE m.home_id END as opponent_id,
          CASE WHEN m.home_id = t.id THEN ta.name ELSE th.name END as opponent_name,
          CASE WHEN m.home_id = t.id THEN ta.img ELSE th.img END as opponent_img,
          m.date,
          ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY m.date ASC) as rn
        FROM teams t
        JOIN matches m ON m.home_id = t.id OR m.away_id = t.id
        LEFT JOIN teams th ON m.home_id = th.id
        LEFT JOIN teams ta ON m.away_id = ta.id
        WHERE m.season_id = $1 AND m.date > NOW()
      ) sub
      WHERE rn = 1
    )
    SELECT
      ml.player_id,
      p.name,
      p.img,
      ps.position,
      t.id as team_id,
      t.name as team,
      t.img as team_img,
      ml.price,
      ps.price as real_price,
      COALESCE(ps.price_increment, 0) as price_trend,
      COALESCE(pt.total_points, 0) as total_points,
      COALESCE(pt.season_avg, 0) as season_avg,
      pt.min_points,
      pt.max_points,
      pt.games_played,
      ml.seller_id,
      us.name as seller_name,
      us.icon as seller_icon,
      us.color_index as seller_color,
      t.code as player_team,
      -- Next opponent logic
      tnm.opponent_id as next_opponent_id,
      tnm.opponent_name as next_opponent_name,
      tnm.opponent_img as next_opponent_img,
      tnm.date as next_match_date
    FROM market_listings ml
    JOIN players p ON ml.player_id = p.id
    JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = ml.season_id
    LEFT JOIN teams t ON ps.team_id = t.id
    LEFT JOIN user_seasons us ON ml.seller_id = us.user_id AND ml.season_id = us.season_id
    LEFT JOIN PlayerTotals pt ON p.id = pt.player_id
    LEFT JOIN TeamNextMatch tnm ON tnm.team_id = ps.team_id
    WHERE ml.season_id = $1
      AND ml.listed_at = (SELECT MAX(listed_at) FROM market_listings WHERE season_id = $1)
    ORDER BY pt.season_avg DESC NULLS LAST, ml.price DESC
  `;
  return (await pgClient.query(query, [seasonId])).rows;
}
