import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MatchVenueMap } from '@/features/matches/public';
import type { ScheduleMapModel } from '../models/schedule';

export default function ScheduleMapScreen({ model }: { model: ScheduleMapModel }) {
  return (
    <MobileDetailScaffold
      title="Mapa de partidos"
      context="Horario"
      backHref={model.backHref}
      description="Sedes y desplazamientos de los partidos de la jornada."
    >
      <div className="mobile-full-map">
        <MatchVenueMap matches={model.matches} selectedTeamId={0} />
      </div>
    </MobileDetailScaffold>
  );
}
