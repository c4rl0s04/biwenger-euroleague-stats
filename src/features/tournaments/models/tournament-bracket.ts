export interface TournamentBracketMatch {
  id: string | number;
  isTwoLegged: boolean;
  isFinished: boolean;
  winner: 'home' | 'away' | null;
  home_user_id: string | null;
  home_user_name: string | null;
  home_user_icon: string | null;
  home_user_color: number | null;
  away_user_id: string | null;
  away_user_name: string | null;
  away_user_icon: string | null;
  away_user_color: number | null;
  home_leg1?: number | null;
  away_leg1?: number | null;
  home_leg2?: number | null;
  away_leg2?: number | null;
  home_total: number | null;
  away_total: number | null;
}

export interface TournamentBracketRound {
  type: string | null;
  name: string | null;
  matches: TournamentBracketMatch[];
}
