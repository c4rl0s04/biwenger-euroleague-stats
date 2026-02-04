import { fetchUserSeasonStats } from '@/lib/services';

import { BackButton, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * User Profile Page
 *
 * User profile, squad overview, and season stats.
 */
export default async function UserProfilePage({ params }) {
  const { id } = await params;
  // User ID is TEXT in DB, we must check it as a string, not number
  const userId = id;

  const stats = await fetchUserSeasonStats(userId);
  const userName = stats?.name || 'Usuario';

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          <PageHeader
            title={`Perfil de ${userName}`}
            description="Estadísticas y plantilla"
            className="px-0 pb-10"
          />

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
