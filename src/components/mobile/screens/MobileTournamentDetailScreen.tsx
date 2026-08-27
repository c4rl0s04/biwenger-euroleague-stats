import { Brackets, ListChecks, Trophy } from 'lucide-react';

import MobileRecordList from '../MobileRecordList';
import { MobileBackHeader, MobileMetric, MobileMetricGrid, MobileScreen, MobileSectionHeading, MobileSectionLink } from '../MobileScreen';

type RecordValue = Record<string, any>;

export default function MobileTournamentDetailScreen({ tournament, standings, fixtures }: { tournament: RecordValue; standings: RecordValue[]; fixtures: RecordValue[] }) {
  const winner = tournament.data?.winner;
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileBackHeader title={tournament.name} context="Torneo" backHref="/tournaments" />
      {winner && <section className="mobile-winner-banner"><Trophy size={28} aria-hidden="true" /><div><span>Campeón</span><strong>{winner.name}</strong></div></section>}
      <MobileMetricGrid>
        <MobileMetric label="Estado" value={tournament.status === 'active' ? 'Activo' : 'Final'} tone="accent" />
        <MobileMetric label="Formato" value={tournament.type === 'league' ? 'Liga' : 'Copa'} />
        <MobileMetric label="Partidos" value={fixtures.length} />
        <MobileMetric label="Participantes" value={standings.length} tone="positive" />
      </MobileMetricGrid>
      <MobileSectionHeading>Situación</MobileSectionHeading>
      <MobileRecordList data={standings.slice(0, 4)} linkPrefix="/user" />
      <MobileSectionHeading>Explorar</MobileSectionHeading>
      <div>
        <MobileSectionLink href={`/tournaments/${tournament.id}/standings`} title="Clasificación" description="Posiciones y balance" icon={ListChecks} accent="green" />
        <MobileSectionLink href={`/tournaments/${tournament.id}/bracket`} title="Cuadro" description="Fases y enfrentamientos" icon={Brackets} />
        <MobileSectionLink href={`/tournaments/${tournament.id}/results`} title="Resultados" description="Todos los partidos del torneo" icon={Trophy} accent="blue" />
      </div>
    </MobileScreen>
  );
}
