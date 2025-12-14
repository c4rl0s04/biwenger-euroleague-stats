import { getPlayerDetails } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PlayerProfileClient from '@/components/player/PlayerProfileClient';
import ThemeBackground from '@/components/ui/ThemeBackground';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }) {
  const { id } = await params;
  const player = getPlayerDetails(id);

  if (!player) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Jugador no encontrado</h1>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al dashboard
        </Link>
      </div>
    );
  }

  // Pass plain object to client component
  return (
    <>
      <div className="fixed inset-0 z-0">
         <ThemeBackground />
      </div>
      <div className="relative z-10 p-6">
        <PlayerProfileClient player={player} />
      </div>
    </>
  );
}
