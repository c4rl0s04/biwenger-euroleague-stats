import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageHeader } from '@/components/ui';
import SeasonReviewClient from '@/components/season-review/SeasonReviewClient';
import { getSeasonResilienceOverview } from '@/lib/services';
import { getEmergentArtifactRepository } from '@/lib/season-review/emergent-artifact-service';
import { toPublicEmergentCatalog } from '@/lib/season-review/emergent-artifacts';

export const metadata: Metadata = {
  title: 'Análisis 25/26 | Biwenger Stats',
  description: 'Diagnóstico y simulador de equilibrio competitivo de la temporada 2025/26.',
};

export default async function SeasonReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [overview, privateCatalog] = await Promise.all([
    getSeasonResilienceOverview(),
    getEmergentArtifactRepository()
      .getCatalog()
      .catch(() => null),
  ]);
  const emergentCatalog = privateCatalog ? toPublicEmergentCatalog(privateCatalog) : null;
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PageHeader
        title="Análisis 25/26"
        description="Desde 40 M€ iguales: cuándo se abrió la brecha y qué reglas hacen recuperable un error."
      />
      <SeasonReviewClient
        overview={overview}
        simulationAnalysis={null}
        emergentCatalog={emergentCatalog}
      />
    </main>
  );
}
