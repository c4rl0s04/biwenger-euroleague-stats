import { Section } from '@/components/layout';
import { PageHeader } from '@/components/ui';
import { getAllTournaments } from '@/lib/services/tournamentService';
import { getGlobalTournamentStats } from '@/lib/services/statsService';
import {
  ActiveTournamentsSection,
  HallOfFame,
  StatsTable,
  RecordsSection,
} from '@/components/tournaments';

export default async function TournamentsPage() {
  const [tournamentsData, statsData] = await Promise.all([
    getAllTournaments(),
    getGlobalTournamentStats(),
  ]);

  const { active, finished } = tournamentsData;
  const { hallOfFame, globalStats, leagueStats, records } = statsData;

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
          <StatsTable data={globalStats} title="Histórico Completo" type="global" />
        </Section>
      )}
    </div>
  );
}
