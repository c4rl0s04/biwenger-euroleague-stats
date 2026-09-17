import { getPorrasStats } from '@/features/predictions/server';
import { PredictionsClient, MobilePredictionsScreen } from '@/features/predictions/public';
import { PageHeader } from '@/components/ui';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const metadata = {
  title: 'Porras - BiwengerStats',
  description: 'Predicciones de la temporada, logros y clasificación.',
};

// Revalidate data every 5 minutes or on demand
export const revalidate = 300;

export default async function PredictionsPage() {
  const [stats, phone] = await Promise.all([getPorrasStats(), isPhonePresentation()]);

  if (phone) return <MobilePredictionsScreen stats={stats} />;

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
