/**
 * Players Page
 *
 * Player discovery, search, and analysis.
 *
 * See PAGE_ARCHITECTURE.md section 3 for full layout specification.
 */

import { fetchAllPlayers } from '@/lib/services';
import PlayersDiscovery from '@/components/players-list/PlayersDiscovery';
import { PageHeader } from '@/components/ui';
import MobilePlayersScreen from '@/components/mobile/screens/MobilePlayersScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({ searchParams }) {
  const players = await fetchAllPlayers();

  if (await isPhonePresentation()) {
    const params = await searchParams;
    const query = String(params?.q ?? '').trim();
    const position = String(params?.position ?? '').trim();
    const normalizedQuery = query.toLocaleLowerCase('es');
    const normalizedPosition = position.toLocaleLowerCase('es');
    const filtered = players.filter((player) => {
      const matchesQuery =
        !normalizedQuery ||
        `${player.name ?? ''} ${player.team_name ?? player.team ?? ''}`
          .toLocaleLowerCase('es')
          .includes(normalizedQuery);
      const matchesPosition =
        !normalizedPosition ||
        String(player.position ?? '').toLocaleLowerCase('es') === normalizedPosition;
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
