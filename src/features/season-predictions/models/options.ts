import type { ManagerDirectoryViewModel } from '@/features/managers/public';
import type { PlayerCatalogueItemViewModel } from '@/features/players/public';
import { POSITIONS } from '@/lib/constants/thresholds';
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

export function mapPlayerOptions(
  players: readonly PlayerCatalogueItemViewModel[]
): PredictionChoice[] {
  return players
    .map((player) => {
      const positionCode = Number(player.position);
      const position = POSITIONS[positionCode as keyof typeof POSITIONS] ?? player.position;
      return {
        id: String(player.id),
        name: player.name,
        detail: [player.team_name, position].filter(Boolean).join(' · '),
        image: player.img || null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function mapManagerOptions(
  managers: readonly ManagerDirectoryViewModel[]
): PredictionChoice[] {
  return managers
    .map((manager) => ({
      id: manager.id,
      name: manager.name || `Mánager ${manager.id}`,
      image: manager.icon,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
