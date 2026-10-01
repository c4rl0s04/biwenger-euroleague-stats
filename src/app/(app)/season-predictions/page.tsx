import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getRequestSeasonContext } from '@/lib/seasons/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { SeasonPredictionsScreen } from '@/features/season-predictions/public';
import { readSeasonPredictions } from '@/features/season-predictions/server';

export const metadata = {
  title: 'Predicciones de temporada - Biwenger Stats',
  description: 'Elige tus predicciones para la temporada.',
};

export const dynamic = 'force-dynamic';

export default async function SeasonPredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const [context, phone] = await Promise.all([getRequestSeasonContext(), isPhonePresentation()]);
  const data = await readSeasonPredictions(context.currentSeasonId, session.user.id);
  const seasonName =
    context.seasons.find((season) => season.id === context.currentSeasonId)?.name ??
    context.currentSeasonId;
  return (
    <SeasonPredictionsScreen
      key={context.currentSeasonId}
      seasonName={seasonName}
      data={data}
      phone={phone}
    />
  );
}
