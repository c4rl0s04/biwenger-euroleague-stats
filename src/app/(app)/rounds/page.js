import RoundsPageClient from '@/components/rounds/RoundsPageClient';

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
        <div className="container mx-auto px-4 pt-12 pb-2 relative z-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
              <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
              <span className="text-gradient">Jornadas</span>
            </h1>
            <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6">
              Análisis de alineaciones, puntuaciones y clasificación jornada a jornada.
            </p>
          </div>
        </div>

        <RoundsPageClient />
      </main>
    </div>
  );
}
