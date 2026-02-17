import { Section } from '@/components/layout';
import { PageHeader } from '@/components/ui';
import { getTournaments } from '@/lib/db';
import { ActiveTournamentsSection } from '@/components/tournaments';

export default async function TournamentsPage() {
  const allTournaments = await getTournaments();

  const activeTournaments = allTournaments.filter((t) => t.status === 'active');
  const finishedTournaments = allTournaments.filter((t) => t.status !== 'active');

  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title="Torneos"
        description="Explora los diferentes torneos, copas y eliminatorias disputados durante la temporada."
      />

      {/* Active Tournaments */}
      <Section title="Torneos Activos" id="active-tournaments" delay={0} background="section-base">
        <ActiveTournamentsSection tournaments={activeTournaments} />
      </Section>

      {/* Finished Tournaments */}
      {finishedTournaments.length > 0 && (
        <Section
          title="Histórico de Torneos"
          id="finished-tournaments"
          delay={100}
          background="section-raised"
        >
          <ActiveTournamentsSection tournaments={finishedTournaments} />
        </Section>
      )}
    </div>
  );
}
