import type { FeedMatch, FeedResult } from '../../models/feed-match';
export interface FeedMatchRecord {
  id: number;
  date: Date | string | null;
  home_team: string | null;
  away_team: string | null;
}
export interface FeedResultRecord extends FeedMatchRecord {
  home_score: number | null;
  away_score: number | null;
}
export function mapFeedMatch(row: FeedMatchRecord): FeedMatch {
  return {
    id: row.id,
    date: row.date instanceof Date ? row.date.toISOString() : row.date,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
  };
}
export function mapFeedResult(row: FeedResultRecord): FeedResult {
  return { ...mapFeedMatch(row), homeScore: row.home_score, awayScore: row.away_score };
}
