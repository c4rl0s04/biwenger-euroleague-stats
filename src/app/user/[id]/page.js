import { getUserSeasonStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * User Profile Page
 *
 * User profile, squad overview, and season stats.
 */
export default async function UserProfilePage({ params }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  const stats = getUserSeasonStats(userId);
  const userName = stats?.name || 'Usuario';

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-10 bg-primary rounded-full"></span>
            <span className="text-foreground">{`Perfil de ${userName}`}</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10">Estadísticas y plantilla</p>

          {/* Placeholder for future implementation */}
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
            <p className="text-muted-foreground text-lg">🚧 Página en construcción</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Próximamente: perfil completo, plantilla y comparativa.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
