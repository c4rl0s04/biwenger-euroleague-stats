'use client';

/**
 * Market Page
 *
 * Current market status and transfer history.
 *
 * See PAGE_ARCHITECTURE.md section 8 for full layout specification.
 */

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
            <span className="text-gradient">Mercado</span>
          </h1>
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6 mb-10">
            Análisis de fichajes y oportunidades de mercado
          </p>

          {/* Placeholder for future implementation */}
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-12 text-center">
            <p className="text-muted-foreground text-lg">🚧 Página en construcción</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Próximamente: mercado actual, chollos y actividad reciente.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
