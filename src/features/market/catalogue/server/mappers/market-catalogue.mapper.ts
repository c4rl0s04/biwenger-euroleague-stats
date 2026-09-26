import type { PlayerFormStatsViewModel } from '@/features/players/public';
import type { CurrentMarketListing, MarketOpportunity } from '../../models/market-catalogue';
import type {
  MarketListingRecord,
  MarketOpportunityRecord,
} from '../queries/market-catalogue.records';
import { scoreMarketListing } from '../../lib/market-recommendation';

export function mapMarketOpportunity(
  row: MarketOpportunityRecord,
  form?: PlayerFormStatsViewModel
): MarketOpportunity {
  const average = form?.formScore || 0;
  return {
    player_id: row.player_id,
    name: row.name,
    position: row.position,
    team_id: row.team_id,
    team: row.team,
    price: row.price,
    price_trend: row.price_trend,
    avg_recent_points: average,
    recent_scores: form?.recentScores || '',
    value_score:
      average > 0
        ? parseFloat(((average * 1000000) / Math.max(Number(row.price), 1)).toFixed(2))
        : 0,
  };
}

export function mapMarketListing(
  row: MarketListingRecord,
  form: PlayerFormStatsViewModel | undefined,
  counts: Readonly<Record<number, number>>,
  probabilities: Readonly<Record<number, number>>
): CurrentMarketListing {
  const valueScore = row.total_points
    ? parseFloat(((Number(row.total_points) * 1000000) / Math.max(Number(row.price), 1)).toFixed(2))
    : 0;
  return {
    player_id: row.player_id,
    name: row.name,
    img: row.img,
    position: row.position,
    team_id: row.team_id,
    team: row.team,
    team_img: row.team_img,
    real_price: row.real_price,
    min_points: row.min_points,
    max_points: row.max_points,
    games_played: row.games_played,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_icon: row.seller_icon,
    seller_color: row.seller_color,
    player_team: row.player_team,
    next_opponent_id: row.next_opponent_id,
    next_opponent_name: row.next_opponent_name,
    next_opponent_img: row.next_opponent_img,
    next_match_date:
      row.next_match_date instanceof Date ? row.next_match_date.toISOString() : row.next_match_date,
    recent_scores: form?.recentScores ?? null,
    ...scoreMarketListing(
      {
        min_points: row.min_points,
        max_points: row.max_points,
        games_played: row.games_played,
        team_id: row.team_id,
        season_avg: row.season_avg,
        avg_recent_points: form?.averageRecentPoints ?? 0,
        value_score: valueScore,
        price_trend: row.price_trend,
        price: row.price,
        total_points: row.total_points,
      },
      counts,
      probabilities
    ),
  };
}
