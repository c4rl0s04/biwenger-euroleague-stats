/**
 * Players Page
 *
 * Player discovery, search, and analysis.
 *
 * See PAGE_ARCHITECTURE.md section 3 for full layout specification.
 */

import { fetchAllPlayers } from '@/lib/services';
import PlayersTable from '@/components/players-list/PlayersTable';
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
      <main className="w-full px-4 sm:px-6 lg:px-8 pb-2 relative z-10">
        <div className="max-w-7xl mx-auto">
          <PlayersTable initialPlayers={players} />
        </div>
      </main>
    </div>
  );
}
