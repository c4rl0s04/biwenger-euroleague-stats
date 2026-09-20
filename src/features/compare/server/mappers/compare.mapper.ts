import 'server-only';
import type { ComparisonSquadMember } from '@/features/managers/public';
import type { PorrasStats } from '@/features/predictions/public';
import type { CompareHistory, ComparePredictions } from '../../models/compare';

export function mapSquadSummary(squad: ComparisonSquadMember[]): CompareHistory['squadStats'] {
  const validSquad = squad.filter((p) => p.points > 0);
  const bestPlayer = squad.length > 0 ? squad[0] : null;
  return {
    avgPlayerPoints:
      validSquad.length > 0
        ? validSquad.reduce((sum, p) => sum + p.points, 0) / validSquad.length
        : 0,
    bestPlayer: bestPlayer
      ? { name: bestPlayer.name, points: bestPlayer.points }
      : { name: '-', points: 0 },
  };
}
export function mapComparePredictions(data: PorrasStats | null | undefined): ComparePredictions {
  return {
    achievements: data?.achievements || {},
    clutch: data?.clutch_stats || [],
    victorias: data?.porra_stats?.victorias || [],
    promedios: data?.porra_stats?.promedios || [],
    participation: data?.participation || [],
  };
}
