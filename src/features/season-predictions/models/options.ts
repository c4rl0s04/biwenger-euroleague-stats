export interface PredictionChoice {
  id: string;
  name: string;
  detail?: string;
  image: string | null;
}

export interface SeasonPredictionOptions {
  players: PredictionChoice[];
  teams: PredictionChoice[];
  managers: PredictionChoice[];
}

export function withTeamCrests(
  options: SeasonPredictionOptions,
  crests: ReadonlyMap<string, string>
): SeasonPredictionOptions {
  return {
    ...options,
    teams: options.teams.map((team) => ({
      ...team,
      image: crests.get(team.id) ?? team.image,
    })),
  };
}
