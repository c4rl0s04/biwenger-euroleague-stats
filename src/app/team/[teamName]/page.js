'use client';

import { useParams } from 'next/navigation';

/**
 * Team Page
 *
 * Team roster, stats, and upcoming matches.
 */

export default function TeamPage() {
  const params = useParams();
  const teamName = decodeURIComponent(params.teamName || '');

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-10 bg-primary rounded-full"></span>
            <span className="text-foreground">{teamName || 'Equipo'}</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10">Información del equipo</p>

          {/* Placeholder for future implementation */}
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
            <p className="text-muted-foreground text-lg">🚧 Página en construcción</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Próximamente: plantilla, estadísticas y próximos partidos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
