import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageHeader } from '@/components/ui';
import SeasonReviewClient from '@/components/season-review/SeasonReviewClient';
import { getSeasonReviewOverview } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Análisis 25/26 | Biwenger Stats',
  description: 'Diagnóstico y simulador de equilibrio competitivo de la temporada 2025/26.',
};

export default async function SeasonReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const overview = await getSeasonReviewOverview();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PageHeader
        title="Análisis 25/26"
        description="Una auditoría de la economía de la liga para decidir juntos las reglas de la próxima temporada."
      />
      <SeasonReviewClient overview={overview} />
    </main>
  );
}
