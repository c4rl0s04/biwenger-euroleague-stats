import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRequestSeasonContext } from '@/lib/seasons/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import {
  MobileSeasonPredictionsHub,
  SeasonPredictionsHub,
} from '@/features/season-predictions/public';
import { getSeasonPredictionsHub } from '@/features/season-predictions/server';

export const metadata = {
  title: 'Predicciones - Biwenger Stats',
  description: 'Predicciones de pretemporada, bracket de playoffs y clasificación de la porra.',
};

export const dynamic = 'force-dynamic';

export default async function SeasonPredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const [context, phone] = await Promise.all([getRequestSeasonContext(), isPhonePresentation()]);
  const data = await getSeasonPredictionsHub(context.currentSeasonId, session.user.id);
  const seasonName =
    context.seasons.find((season) => season.id === context.currentSeasonId)?.name ??
    context.currentSeasonId;
  return phone ? (
    <MobileSeasonPredictionsHub seasonName={seasonName} data={data} />
  ) : (
    <SeasonPredictionsHub seasonName={seasonName} data={data} />
  );
}
