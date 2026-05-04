import { fetchUserSeasonStats, fetchUserSquadDetails, fetchUserRecentRounds } from '@/lib/services';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ManagerProfileClient from '@/components/user/ManagerProfileClient';
import { ThemeBackground } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ManagerPage({ params }) {
  const { id } = await params;

  // Fetch all necessary data for the manager profile
  const [stats, squad, recentRounds] = await Promise.all([
    fetchUserSeasonStats(id),
    fetchUserSquadDetails(id),
    fetchUserRecentRounds(id),
  ]);

  if (!stats || !stats.name || stats.name === 'Desconocido') {
    return (
      <div className="p-6 text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Manager no encontrado</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          El ID proporcionado no corresponde a ningún usuario activo en la liga.
        </p>
        <Link
          href="/standings"
          className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Volver a la clasificación
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <ThemeBackground />
      </div>
      <div className="relative z-10 p-6">
        <ManagerProfileClient stats={stats} squad={squad} recentRounds={recentRounds} />
      </div>
    </>
  );
}
