import 'server-only';
import type { CaptainReadRows, HomeAwayRow } from '../queries/manager-performance.query';
import type { ManagerCaptainStats, ManagerHomeAwayStats } from '../../models/manager-performance';

export function mapManagerCaptainStats({
  overall,
  mostUsed,
  best,
  worst,
}: CaptainReadRows): ManagerCaptainStats {
  return {
    total_rounds: overall ? parseInt(String(overall.total_rounds)) : 0,
    extra_points: overall ? parseInt(String(overall.extra_points)) : 0,
    avg_points: overall ? parseFloat(String(overall.avg_points)) : 0,
    most_used: mostUsed.map((m) => ({
      player_id: m.player_id,
      name: m.name,
      times_captain: parseInt(String(m.times_captain)) || 0,
      avg_as_captain: parseFloat(String(m.avg_as_captain)) || 0,
      total_as_captain: parseInt(String(m.total_as_captain)) || 0,
    })),
    best_round: best
      ? { name: best.name, points: parseInt(String(best.points)) || 0 }
      : { name: '', points: 0 },
    worst_round: worst
      ? { name: worst.name, points: parseInt(String(worst.points)) || 0 }
      : { name: '', points: 0 },
  };
}

export function mapManagerHomeAway(stats: HomeAwayRow | undefined): ManagerHomeAwayStats {
  // A missing aggregate row threw previously; do not silently replace that error with zeros.
  const totalHome = parseInt(String(stats!.total_home)) || 0;
  const totalAway = parseInt(String(stats!.total_away)) || 0;
  const gamesHome = parseInt(String(stats!.games_home)) || 0;
  const gamesAway = parseInt(String(stats!.games_away)) || 0;
  return {
    total_home: totalHome,
    total_away: totalAway,
    avg_home: gamesHome > 0 ? Math.round(totalHome / gamesHome) : 0,
    avg_away: gamesAway > 0 ? Math.round(totalAway / gamesAway) : 0,
    difference_pct:
      totalHome > 0 && totalAway > 0 ? Math.round(((totalHome - totalAway) / totalAway) * 100) : 0,
  };
}
