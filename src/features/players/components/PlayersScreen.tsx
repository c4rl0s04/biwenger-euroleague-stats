import { PageHeader } from '@/components/ui';

import type { PlayerCatalogueItemViewModel } from '../models/player-catalogue';
import PlayersDiscovery from './desktop/catalogue/PlayersDiscovery';
import MobilePlayersScreen from './mobile/MobilePlayersScreen';

export function PlayersScreen({
  players,
  phone,
  query,
  position,
}: {
  players: PlayerCatalogueItemViewModel[];
  phone: boolean;
  query: string;
  position: string;
}) {
  if (phone) {
    const normalizedQuery = query.toLocaleLowerCase('es');
    const normalizedPosition = position.toLocaleLowerCase('es');
    const filtered = players.filter((player) => {
      const matchesQuery =
        !normalizedQuery ||
        `${player.name} ${player.team_name}`.toLocaleLowerCase('es').includes(normalizedQuery);
      const matchesPosition =
        !normalizedPosition || player.position.toLocaleLowerCase('es') === normalizedPosition;
      return matchesQuery && matchesPosition;
    });
    return <MobilePlayersScreen players={filtered} query={query} position={position} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Jugadores"
        description="Explora todos los jugadores de la liga, sus valores y estadísticas."
      />
      <main className="w-full relative z-10">
        <PlayersDiscovery initialPlayers={players} />
      </main>
    </div>
  );
}
