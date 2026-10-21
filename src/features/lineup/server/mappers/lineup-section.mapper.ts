import type { ManagerSquadViewModel } from '@/features/managers/public';
import type { LineupSectionModel } from '../../models/section';

export function mapLineupSection(squad: ManagerSquadViewModel | null): LineupSectionModel {
  return {
    playerCount: squad?.player_count ?? 0,
    totalValue: squad?.total_value ?? 0,
    risingCount: squad?.top_rising.length ?? 0,
    fallingCount: squad?.top_falling.length ?? 0,
    rows: squad
      ? squad.players.slice(0, 20).map((player, index) => ({
          key: String(player.id ?? index),
          title: player.name ?? `Registro ${index + 1}`,
          subtitle: player.team ?? player.position,
          value:
            player.points != null
              ? Number(player.points)
              : player.price != null
                ? Number(player.price)
                : null,
          href: player.id != null ? `/player/${player.id}` : null,
        }))
      : [{ key: '0', title: 'Registro 1' }],
  };
}
