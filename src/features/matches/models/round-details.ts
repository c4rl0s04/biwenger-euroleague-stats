export interface RoundFixture {
  home_id: number | null;
  away_id: number | null;
  home_team: string | null;
  away_team: string | null;
  date: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home_logo: string | null;
  home_short: string | null;
  away_logo: string | null;
  away_short: string | null;
  home_position: number | null;
  away_position: number | null;
}
export interface RoundDetails {
  round_id: number | null;
  round_name: string | null;
  start_date: string | null;
  end_date: string | null;
  matches: RoundFixture[];
}
