import { fetchTeamProfile } from '@/lib/services';
import TeamProfileClient from '@/components/team/TeamProfileClient';
import { BackButton, ThemeBackground } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function TeamPage({ params }) {
  const { id } = await params;
  const teamId = parseInt(id, 10);
  const team = await fetchTeamProfile(teamId);

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-2 text-white">Equipo no encontrado</h1>
        <p className="text-white/40 mb-6">No hemos podido encontrar el equipo que buscas.</p>
        <BackButton label="Volver atrás" className="text-blue-400 hover:underline" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <ThemeBackground />
      </div>
      <main className="relative z-10 w-full pt-12">
        <TeamProfileClient team={team} />
      </main>
    </>
  );
}
