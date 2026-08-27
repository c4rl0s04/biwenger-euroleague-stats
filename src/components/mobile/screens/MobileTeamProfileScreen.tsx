import { CalendarDays, Users } from 'lucide-react';

import {
  MobileBackHeader,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

type Team = Record<string, any>;

export default function MobileTeamProfileScreen({ team }: { team: Team }) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileBackHeader title={team.name} context="Equipo Euroliga" backHref="/players" />
      <section className="mobile-profile-identity">
        <span className="mobile-profile-badge">{team.code ?? 'EL'}</span>
        <div><p>Equipo</p><h2>{team.name}</h2><span>{team.country ?? team.city ?? 'Euroleague'}</span></div>
      </section>
      <MobileMetricGrid>
        <MobileMetric label="Jugadores" value={team.roster?.length ?? 0} tone="accent" />
        <MobileMetric label="Próximos" value={team.upcomingMatches?.length ?? 0} />
        <MobileMetric label="Recientes" value={team.recentMatches?.length ?? 0} />
        <MobileMetric label="Propietarios" value={new Set((team.roster ?? []).map((player: Team) => player.owner_id).filter(Boolean)).size} tone="positive" />
      </MobileMetricGrid>
      <MobileSectionHeading>Equipo</MobileSectionHeading>
      <div>
        <MobileSectionLink href={`/team/${team.id}/roster`} title="Plantilla" description="Jugadores, posiciones y propiedad" icon={Users} accent="green" />
        <MobileSectionLink href={`/team/${team.id}/matches`} title="Partidos" description="Próximos retos y resultados" icon={CalendarDays} />
      </div>
    </MobileScreen>
  );
}
