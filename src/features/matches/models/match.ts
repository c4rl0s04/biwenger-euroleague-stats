export type MatchStatus = string | null;

export interface MatchTeamSummaryViewModel {
  id: number;
  name: string;
  score: number | null;
}

export interface MatchTeamViewModel extends MatchTeamSummaryViewModel {
  code: string;
  imageUrl: string;
  city: string | null;
  arena: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface MatchListItemViewModel {
  id: number;
  date: string | null;
  status: MatchStatus;
  home: MatchTeamSummaryViewModel;
  away: MatchTeamSummaryViewModel;
}

export interface MatchViewModel extends MatchListItemViewModel {
  home: MatchTeamViewModel;
  away: MatchTeamViewModel;
}

export interface MatchRoundViewModel {
  roundId: number;
  roundName: string;
  roundIndex: number;
  matches: MatchViewModel[];
}

export interface MatchesScreenViewModel {
  rounds: MatchRoundViewModel[];
  currentRoundId: number | null;
  selectedRoundId: number | null;
}

export interface MatchRoundScreenViewModel {
  round: MatchRoundViewModel | null;
  selectedRoundId: number | null;
}
