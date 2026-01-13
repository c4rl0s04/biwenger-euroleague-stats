/**
 * Players Page
 *
 * Player discovery, search, and analysis.
 *
 * See PAGE_ARCHITECTURE.md section 3 for full layout specification.
 */

import { getAllPlayers } from '@/lib/db/queries/players';
import PlayersTable from '@/components/players-list/PlayersTable';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players = await getAllPlayers();

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-10 bg-primary rounded-full"></span>
            <span className="text-foreground">Jugadores</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Explora todos los jugadores de la liga, sus valores y estadísticas.
          </p>

          <PlayersTable initialPlayers={players} />
        </div>
      </main>
    </div>
  );
}
