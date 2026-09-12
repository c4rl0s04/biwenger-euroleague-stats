import 'server-only';
import type { PlayerFormStatsViewModel } from '@/features/players/public';
import type { CaptainCandidateRow, ManagerAlertRows } from '../queries/manager-preparation.query';
import type {
  ManagerCaptainRecommendation,
  ManagerPersonalizedAlert,
} from '../../models/manager-preparation';

export function mapCaptainRecommendations(
  rows: CaptainCandidateRow[],
  formRows: PlayerFormStatsViewModel[],
  limit: number
): ManagerCaptainRecommendation[] {
  const formMap = new Map(formRows.map((row) => [row.playerId, row]));
  return rows
    .map((row) => {
      const form = formMap.get(Number(row.player_id));
      const avg = form?.formScore || 0;
      let formLabel = 'Forma baja';
      if (avg >= 25) formLabel = 'Excelente forma';
      else if (avg >= 18) formLabel = 'Buena forma';
      else if (avg >= 12) formLabel = 'Forma regular';
      return {
        player_id: row.player_id,
        name: row.name,
        position: row.position,
        team_id: row.team_id,
        team: row.team,
        avg_recent_points: avg,
        recent_games: form ? form.recentScores.split(',').filter((s) => s !== 'X').length : 0,
        recent_scores: form?.recentScores || '',
        form_label: formLabel,
      };
    })
    .filter((p) => p.avg_recent_points > 0)
    .sort((a, b) => b.avg_recent_points - a.avg_recent_points)
    .slice(0, limit);
}

export function mapManagerAlerts(
  { gains, losses, goodForm }: ManagerAlertRows,
  limit: number
): ManagerPersonalizedAlert[] {
  const alerts: ManagerPersonalizedAlert[] = [];
  gains.forEach((player) =>
    alerts.push({
      type: 'price_gain',
      icon: '📈',
      message: `Tu jugador ${player.name} ha ganado ${(parseInt(String(player.price_increment)) / 1000000).toFixed(2)}M€`,
      severity: 'success',
    })
  );
  losses.forEach((player) =>
    alerts.push({
      type: 'price_loss',
      icon: '📉',
      message: `Tu jugador ${player.name} ha perdido ${Math.abs(parseInt(String(player.price_increment)) / 1000000).toFixed(2)}M€`,
      severity: 'warning',
    })
  );
  if (goodForm)
    alerts.push({
      type: 'good_performance',
      icon: '⭐',
      message: `¡${goodForm.name} brilló con ${goodForm.fantasy_points} puntos!`,
      severity: 'info',
    });
  return alerts.slice(0, limit);
}
