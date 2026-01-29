import RoundsPageClient from '@/components/rounds/RoundsPageClient';
import { PageHeader } from '@/components/ui';

/**
 * Lineups Page
 *
 * Squad management and lineup analysis.
 *
 * See PAGE_ARCHITECTURE.md section 7 for full layout specification.
 */

export default function LineupsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        {/* Header Section */}
        <PageHeader
          title="Jornadas"
          description="Análisis de alineaciones, puntuaciones y clasificación jornada a jornada."
        />

        <RoundsPageClient />
      </main>
    </div>
  );
}
