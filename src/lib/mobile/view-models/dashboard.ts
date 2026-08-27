type UnknownRecord = Record<string, any>;

export interface MobileDashboardViewModel {
  managerName: string;
  position: number;
  points: number;
  averagePoints: number;
  victories: number;
  squadValue: number;
  squadSize: number;
  leagueAverage: number;
  nextRound: { id: string; name: string } | null;
  alerts: Array<{ id: string; title: string; severity: string }>;
  formPlayers: string[];
  news: Array<{ id: string; title: string; description: string }>;
}

interface DashboardViewModelInput {
  userDashboard: UnknownRecord;
  leagueDashboard: UnknownRecord;
  nextRoundData: UnknownRecord;
  news: UnknownRecord[];
}

const finiteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function toMobileDashboardViewModel({
  userDashboard,
  leagueDashboard,
  nextRoundData,
  news,
}: DashboardViewModelInput): MobileDashboardViewModel {
  const seasonStats = userDashboard?.seasonStats ?? {};
  const squad = userDashboard?.squadDetails ?? {};
  const round = nextRoundData?.nextRound;

  return {
    managerName: String(seasonStats.name || 'Tu equipo'),
    position: finiteNumber(seasonStats.position),
    points: finiteNumber(seasonStats.total_points),
    averagePoints: finiteNumber(seasonStats.average_points),
    victories: finiteNumber(seasonStats.victories),
    squadValue: finiteNumber(squad.total_value),
    squadSize: finiteNumber(squad.player_count),
    leagueAverage: finiteNumber(leagueDashboard?.leagueAverage),
    nextRound: round
      ? {
          id: String(round.round_id ?? round.id ?? ''),
          name: String(round.round_name ?? round.name ?? 'Próxima jornada'),
        }
      : null,
    alerts: (userDashboard?.alerts ?? []).slice(0, 3).map((alert: UnknownRecord, index: number) => ({
      id: String(alert.id ?? index),
      title: String(alert.title ?? alert.message ?? 'Aviso de tu equipo'),
      severity: String(alert.severity ?? alert.type ?? 'info'),
    })),
    formPlayers: (leagueDashboard?.hotStreaks ?? [])
      .slice(0, 3)
      .map((player: UnknownRecord) => String(player.name ?? player.player_name ?? ''))
      .filter(Boolean),
    news: news.slice(0, 3).map((item, index) => ({
      id: String(item.id ?? index),
      title: String(item.title ?? item.text ?? 'Actualidad de la liga'),
      description: String(item.description ?? item.message ?? ''),
    })),
  };
}
