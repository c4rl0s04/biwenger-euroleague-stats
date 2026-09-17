import { History, Medal, Trophy } from 'lucide-react';

import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';

import type { TournamentCatalogue } from '../../models/tournament-catalogue';

export default function MobileTournamentsScreen({ active, finished }: TournamentCatalogue) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader
        eyebrow="Competición"
        title="Torneos"
        description="Activos, campeones e historial"
      />
      <MobileMetricGrid>
        <MobileMetric label="Activos" value={active.length} tone="accent" />
        <MobileMetric label="Finalizados" value={finished.length} />
        <MobileMetric label="Total" value={active.length + finished.length} tone="positive" />
        <MobileMetric label="Formato" value="Copa" detail="liga y eliminatoria" />
      </MobileMetricGrid>
      <MobileSectionHeading>En juego</MobileSectionHeading>
      <div>
        {active.map((tournament) => (
          <MobileListRow
            key={String(tournament.id)}
            href={`/tournaments/${tournament.id}`}
            leading={<Trophy size={20} aria-hidden="true" />}
            title={tournament.name}
            subtitle={tournament.type === 'league' ? 'Liga' : 'Eliminatoria'}
            trailing="Activo"
          />
        ))}
      </div>
      <MobileSectionHeading>Historial</MobileSectionHeading>
      <div>
        {finished.map((tournament) => (
          <MobileListRow
            key={String(tournament.id)}
            href={`/tournaments/${tournament.id}`}
            leading={<Medal size={20} aria-hidden="true" />}
            title={tournament.name}
            subtitle={tournament.winnerLabel}
          />
        ))}
      </div>
    </MobileScreen>
  );
}
