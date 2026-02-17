import { Section } from '@/components/layout';
import { PageHeader } from '@/components/ui';
import { getAllTournaments } from '@/lib/services/tournamentService';
import { ActiveTournamentsSection } from '@/components/tournaments';

export default async function TournamentsPage() {
  const { active, finished } = await getAllTournaments();

  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title="Torneos"
        description="Explora los diferentes torneos, copas y eliminatorias disputados durante la temporada."
      />

      {/* Active Tournaments */}
      <Section title="Torneos Activos" id="active-tournaments" delay={0} background="section-base">
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
    </div>
  );
}
