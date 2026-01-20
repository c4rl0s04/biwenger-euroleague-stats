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
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-2 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
            <span className="text-gradient">Jugadores</span>
          </h1>
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6 mb-10">
            Explora todos los jugadores de la liga, sus valores y estadísticas.
          </p>

          <PlayersTable initialPlayers={players} />
        </div>
      </main>
    </div>
  );
}
