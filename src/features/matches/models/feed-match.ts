export interface FeedMatch {
  id: number;
  date: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
}
export interface FeedResult extends FeedMatch {
  homeScore: number | null;
  awayScore: number | null;
}
