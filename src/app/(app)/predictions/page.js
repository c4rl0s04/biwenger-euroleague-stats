import { fetchPredictionsStats } from '@/lib/services/features/predictionsService';
import PredictionsClient from '@/components/predictions/PredictionsClient';
import { PageHeader } from '@/components/ui';

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
      <PageHeader
        title="Porras"
        description="Predicciones de la temporada: logros, estadísticas y clasificación en tiempo real."
      />

      {/* Main Content - Full Width Sections */}
      <PredictionsClient stats={stats} />
    </div>
  );
}
