import { fetchTeamProfile } from '@/lib/services';
import { Construction } from 'lucide-react';
import Image from 'next/image';
import { BackButton, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function TeamPage({ params }) {
  const { id } = await params;
  const teamId = parseInt(id, 10);
  const team = await fetchTeamProfile(teamId);

  // Handle case where team is not found
  if (!team) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Equipo no encontrado</h1>
        <p className="text-muted-foreground mb-6">
          No hemos podido encontrar el equipo que buscas.
        </p>
        <BackButton label="Volver atrás" className="text-primary hover:underline" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-20 pb-10 items-center justify-center relative overflow-hidden">
      {/* Background Blur Effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container max-w-2xl px-4 relative z-10 text-center">
        {/* Team Identity */}
        <div className="mb-8 flex flex-col items-center">
          {team.logo ? (
            <div className="w-32 h-32 relative mb-6 drop-shadow-2xl">
              <Image
                src={team.logo}
                alt={team.name}
                fill
                className="object-contain"
                sizes="128px"
                priority // Important for LCP
              />
            </div>
          ) : (
            <div className="w-32 h-32 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🛡️</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            {team.name}
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full mx-auto" />
        </div>

        {/* Construction Message */}
        <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-2xl p-8 md:p-12 shadow-xl mb-8">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Página en Construcción</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Estamos trabajando duro para traerte las estadísticas, plantilla y análisis completo de{' '}
            <span className="text-foreground font-medium">{team.name}</span>.
          </p>
          <p className="text-sm text-muted-foreground/60 mt-4">
            ¡Vuelve pronto para ver las novedades!
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <BackButton
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 hover:text-primary-foreground"
            label="Volver al Dashboard"
            iconSize={20}
          />
        </div>
      </div>
    </div>
  );
}
