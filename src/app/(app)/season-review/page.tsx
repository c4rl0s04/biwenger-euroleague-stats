import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageHeader } from '@/components/ui';
import SeasonReviewClient from '@/components/season-review/SeasonReviewClient';
import MobileSeasonReviewScreen from '@/components/mobile/screens/MobileSeasonReviewScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { getSeasonReviewPageData } from '@/lib/season-review/read-analysis';

export const metadata: Metadata = {
  title: 'Análisis 25/26 | Biwenger Stats',
  description: 'Diagnóstico y simulador de equilibrio competitivo de la temporada 2025/26.',
};

export default async function SeasonReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [{ overview, simulationAnalysis }, phone] = await Promise.all([
    getSeasonReviewPageData(),
    isPhonePresentation(),
  ]);

  if (phone) return <MobileSeasonReviewScreen overview={overview} simulationAnalysis={simulationAnalysis} />;

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PageHeader
        title="Análisis 25/26"
        description="Desde 40 M€ iguales: cuándo se abrió la brecha y qué reglas hacen recuperable un error."
      />
      <SeasonReviewClient overview={overview} simulationAnalysis={simulationAnalysis} />
    </main>
  );
}
