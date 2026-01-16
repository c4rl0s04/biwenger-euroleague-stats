import { fetchPredictionsStats } from '@/lib/services/predictionsService';
import PredictionsClient from '@/components/predictions/PredictionsClient';

export const metadata = {
  title: 'Porras - BiwengerStats',
  description: 'Predicciones de la temporada, logros y clasificación.',
};

// Revalidate data every 5 minutes or on demand
export const revalidate = 300;

export default async function PredictionsPage() {
  const stats = await fetchPredictionsStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="container mx-auto px-4 pt-12 pb-2 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
            <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
            <span className="text-gradient">Porras</span>
          </h1>
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6">
            Predicciones de la temporada: logros, estadísticas y clasificación en tiempo real.
          </p>
        </div>
      </div>

      {/* Main Content - Full Width Sections */}
      <PredictionsClient stats={stats} />
    </div>
  );
}
