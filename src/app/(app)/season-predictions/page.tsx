import { getRequestSeasonContext } from '@/lib/seasons/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { SeasonPredictionsScreen } from '@/features/season-predictions/public';
import { getSeasonPredictionOptions } from '@/features/season-predictions/server';

export const metadata = {
  title: 'Predicciones de temporada - Biwenger Stats',
  description: 'Elige tus predicciones para la temporada.',
};

export default async function SeasonPredictionsPage() {
  const [options, context, phone] = await Promise.all([
    getSeasonPredictionOptions(),
    getRequestSeasonContext(),
    isPhonePresentation(),
  ]);
  const seasonName =
    context.seasons.find((season) => season.id === context.currentSeasonId)?.name ??
    context.currentSeasonId;
  return (
    <SeasonPredictionsScreen
      key={context.currentSeasonId}
      seasonName={seasonName}
      options={options}
      phone={phone}
    />
  );
}
