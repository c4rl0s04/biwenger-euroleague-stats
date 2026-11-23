import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getRequestSeasonContext } from '@/lib/seasons/server';
import { isHubSection, SeasonPredictionsSectionScreen } from '@/features/season-predictions/public';
import { getSeasonPredictionsHub } from '@/features/season-predictions/server';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ section: string }> };

export default async function SeasonPredictionsSectionPage({ params }: PageProps) {
  const { section } = await params;
  if (!isHubSection(section)) notFound();
  await requireMobileRoute(`/season-predictions/${section}`);
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const context = await getRequestSeasonContext();
  const data = await getSeasonPredictionsHub(context.currentSeasonId, session.user.id);
  const seasonName =
    context.seasons.find((season) => season.id === context.currentSeasonId)?.name ??
    context.currentSeasonId;
  return <SeasonPredictionsSectionScreen section={section} seasonName={seasonName} data={data} />;
}
