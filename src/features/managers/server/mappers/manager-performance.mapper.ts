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
    total_rounds: overall ? parseInt(overall.total_rounds as any) : 0,
    extra_points: overall ? parseInt(overall.extra_points as any) : 0,
    avg_points: overall ? parseFloat(overall.avg_points as any) : 0,
    most_used: mostUsed.map((m) => ({
      player_id: m.player_id,
      name: m.name,
      times_captain: parseInt(m.times_captain as any) || 0,
      avg_as_captain: parseFloat(m.avg_as_captain as any) || 0,
      total_as_captain: parseInt(m.total_as_captain as any) || 0,
    })),
    best_round: best
      ? { name: best.name, points: parseInt(best.points as any) || 0 }
      : { name: '', points: 0 },
    worst_round: worst
      ? { name: worst.name, points: parseInt(worst.points as any) || 0 }
      : { name: '', points: 0 },
  };
}

export function mapManagerHomeAway(stats: HomeAwayRow | undefined): ManagerHomeAwayStats {
  // A missing aggregate row threw TypeError previously on stats.total_home;
  // do not silently replace that error with zeros.
  const totalHome = parseInt(stats!.total_home as any) || 0;
  const totalAway = parseInt(stats!.total_away as any) || 0;
  const gamesHome = parseInt(stats!.games_home as any) || 0;
  const gamesAway = parseInt(stats!.games_away as any) || 0;
  return {
    total_home: totalHome,
    total_away: totalAway,
    avg_home: gamesHome > 0 ? Math.round(totalHome / gamesHome) : 0,
    avg_away: gamesAway > 0 ? Math.round(totalAway / gamesAway) : 0,
    difference_pct:
      totalHome > 0 && totalAway > 0 ? Math.round(((totalHome - totalAway) / totalAway) * 100) : 0,
  };
}
