import type { PlayerFormStatsViewModel } from '@/features/players/server';
import type {
  ManagerCaptainRecommendation,
  ManagerPersonalizedAlert,
} from '../../models/manager-preparation';
import type {
  CaptainCandidateRow,
  ManagerAlertsRawData,
} from '../queries/manager-preparation.query';

export function mapCaptainRecommendations(
  candidates: CaptainCandidateRow[],
  formStats: PlayerFormStatsViewModel[],
  limit: number = 3
): ManagerCaptainRecommendation[] {
  const formMap = new Map(formStats.map((f) => [Number(f.playerId), f]));

  return candidates
    .map((row) => {
      const form = formMap.get(Number(row.player_id));
      const avg = form?.formScore ?? null;

      let formLabel = 'Forma baja';
      if (avg == null) formLabel = 'Sin datos';
      else if (avg >= 25) formLabel = 'Excelente forma';
      else if (avg >= 18) formLabel = 'Buena forma';
      else if (avg >= 12) formLabel = 'Forma regular';

      const recentScores = form?.recentScores || '';
      const recentGames = form
        ? recentScores
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s !== 'X' && s !== '?' && s !== '').length
        : 0;

      return {
        player_id: Number(row.player_id),
        name: row.name,
        position: row.position ?? null,
        team_id: row.team_id != null ? Number(row.team_id) : null,
        team: row.team ?? null,
        avg_recent_points: avg,
        recent_games: recentGames,
        recent_scores: recentScores,
        form_label: formLabel,
      };
    })
    .filter((p) => p.avg_recent_points != null && p.avg_recent_points > 0)
    .sort((a, b) => {
      if (a.avg_recent_points == null && b.avg_recent_points == null) return 0;
      if (a.avg_recent_points == null) return 1;
      if (b.avg_recent_points == null) return -1;
      return b.avg_recent_points - a.avg_recent_points;
    })
    .slice(0, limit);
}

export function mapManagerAlerts(
  rawData: ManagerAlertsRawData,
  limit: number = 5
): ManagerPersonalizedAlert[] {
  const alerts: ManagerPersonalizedAlert[] = [];

  rawData.priceGains.forEach((player) => {
    alerts.push({
      type: 'price_gain',
      icon: '📈',
      message: `Tu jugador ${player.name} ha ganado ${(parseInt(String(player.price_increment), 10) / 1000000).toFixed(2)}M€`,
      severity: 'success',
    });
  });

  rawData.priceLosses.forEach((player) => {
    alerts.push({
      type: 'price_loss',
      icon: '📉',
      message: `Tu jugador ${player.name} ha perdido ${Math.abs(parseInt(String(player.price_increment), 10) / 1000000).toFixed(2)}M€`,
      severity: 'warning',
    });
  });

  if (rawData.goodForm) {
    alerts.push({
      type: 'good_performance',
      icon: '⭐',
      message: `¡${rawData.goodForm.name} brilló con ${rawData.goodForm.fantasy_points} puntos!`,
      severity: 'info',
    });
  }

  return alerts.slice(0, limit);
}
