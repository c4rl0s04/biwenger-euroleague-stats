import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MatchesMap from '@/components/schedule/MatchesMap';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchMatchesGrouped } from '@/lib/services';

type PageProps = { searchParams: Promise<{ roundId?: string }> };

export default async function ScheduleMapPage({ searchParams }: PageProps) {
  await requireMobileRoute('/schedule/map');
  const [{ roundId }, grouped] = await Promise.all([searchParams, fetchMatchesGrouped()]);
  const activeRoundId = roundId ?? grouped.currentRoundId ?? grouped.rounds[0]?.round_id;
  const round = grouped.rounds.find((entry) => String(entry.round_id) === String(activeRoundId));

  return (
    <MobileDetailScaffold title="Mapa de partidos" context="Horario" backHref={`/schedule${activeRoundId ? `?roundId=${activeRoundId}` : ''}`} description="Sedes y desplazamientos de los partidos de la jornada.">
      <div className="mobile-full-map">
        <MatchesMap matches={round?.matches ?? []} selectedTeamId={0} />
      </div>
    </MobileDetailScaffold>
  );
}
