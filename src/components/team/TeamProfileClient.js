'use client';

import { FadeIn, BackButton, PageHeader } from '@/components/ui';
import Section from '@/components/layout/Section';
import TeamIdentityCard from './TeamIdentityCard';
import TeamMatchesCard from './TeamMatchesCard';
import TeamRosterCard from './TeamRosterCard';

export default function TeamProfileClient({ team }) {
  if (!team) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header / Back Link */}
      <FadeIn delay={0}>
        <div className="mb-2 px-4 sm:px-6 lg:px-8 pt-4">
          <BackButton />
        </div>
      </FadeIn>

      <PageHeader
        title={team.name}
        description="Resumen de rendimiento, calendario de partidos y análisis de plantilla."
        className="!pt-2"
      />

      {/* Hero Section */}
      <FadeIn delay={100} className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="w-full">
          <TeamIdentityCard team={team} />
        </div>
      </FadeIn>

      <div className="flex flex-col gap-12 mt-12">
        {/* SECTION 1: CALENDARIO Y RESULTADOS */}
        <Section
          title="Calendario y Resultados"
          subtitle="Próximos retos y rendimiento en las últimas jornadas."
          id="matches-results"
          delay={150}
        >
          <TeamMatchesCard upcoming={team.upcomingMatches} recent={team.recentMatches} />
        </Section>

        {/* SECTION 2: PLANTILLA Y JUGADORES */}
        <Section
          title="Análisis de Plantilla"
          subtitle="Distribución de jugadores y estatus de propiedad en la liga."
          id="roster-analysis"
          delay={300}
        >
          <TeamRosterCard roster={team.roster} />
        </Section>
      </div>
    </div>
  );
}
