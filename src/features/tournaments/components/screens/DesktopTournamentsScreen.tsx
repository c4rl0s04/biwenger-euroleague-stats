import { Section } from '@/components/layout';
import { PageHeader } from '@/components/ui';
import {
  ActiveTournamentsSection,
  HallOfFame,
  TournamentHistoryTable,
  RecordsSection,
} from '../index';
import type { Tournament } from '../../models/tournaments';
import type { GlobalTournamentStatistics } from '../../models/tournament-statistics';

interface DesktopTournamentsScreenProps {
  active: Tournament[];
  finished: Tournament[];
  statistics: GlobalTournamentStatistics;
}

export default function DesktopTournamentsScreen({
  active,
  finished,
  statistics,
}: DesktopTournamentsScreenProps) {
  const { hallOfFame, globalStats, records } = statistics;
  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title="Torneos"
        description="Explora los diferentes torneos, copas y eliminatorias disputados durante la temporada."
      />

      {/* Active Tournaments */}
      <Section
        title="Torneos Activos"
        id="active-tournaments"
        delay={0}
        background="section-base"
        className="!pt-2"
      >
        <ActiveTournamentsSection tournaments={active} />
      </Section>

      {/* Finished Tournaments */}
      {finished.length > 0 && (
        <Section
          title="Histórico de Torneos"
          id="finished-tournaments"
          delay={100}
          background="section-raised"
        >
          <ActiveTournamentsSection tournaments={finished} />
        </Section>
      )}

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <Section title="Salón de la Fama" id="hall-of-fame" delay={200} background="section-base">
          <HallOfFame winners={hallOfFame} />
        </Section>
      )}

      {/* Global Stats */}
      {globalStats.length > 0 && (
        <Section title="Récord Global" id="global-stats" delay={300} background="section-raised">
          <RecordsSection records={records} />
          <TournamentHistoryTable data={globalStats} title="Histórico Completo" type="global" />
        </Section>
      )}
    </div>
  );
}
