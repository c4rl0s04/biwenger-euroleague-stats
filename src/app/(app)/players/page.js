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

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players = await fetchAllPlayers();

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
