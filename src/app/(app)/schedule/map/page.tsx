import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MatchVenueMap } from '@/features/matches/public';
import { getMatchesScreenData } from '@/features/matches/server';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { searchParams: Promise<{ roundId?: string }> };

export default async function ScheduleMapPage({ searchParams }: PageProps) {
  await requireMobileRoute('/schedule/map');
  const { roundId } = await searchParams;
  const model = await getMatchesScreenData(roundId);
  const round = model.rounds.find((entry) => entry.roundId === model.selectedRoundId);

  return (
    <MobileDetailScaffold title="Mapa de partidos" context="Horario" backHref={`/schedule${model.selectedRoundId ? `?roundId=${model.selectedRoundId}` : ''}`} description="Sedes y desplazamientos de los partidos de la jornada.">
      <div className="mobile-full-map">
        <MatchVenueMap matches={round?.matches ?? []} selectedTeamId={0} />
      </div>
    </MobileDetailScaffold>
  );
}
