export interface TeamMatchCountRecord {
  team_id: number | string;
  count: string | number;
}
export interface TeamStandingRecord {
  team_id: number | string;
  wins: number | string;
  position: number | string;
}
export interface TeamFormRecord {
  team_id: number | string;
  recent_wins: number | string;
  recent_matches: number | string;
}
export interface TeamOpponentRecord {
  team_id: number | string;
  opponent_id: number | string;
}
export interface TeamCompetitionFacts {
  standings: TeamStandingRecord[];
  form: TeamFormRecord[];
  opponents: TeamOpponentRecord[];
}
