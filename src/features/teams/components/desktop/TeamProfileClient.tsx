'use client';

import type { ComponentType, ReactNode } from 'react';
import { FadeIn, BackButton, PageHeader } from '@/components/ui';
import Section from '@/components/layout/Section';
import type { TeamProfileViewModel } from '../../models/team-profile';
import TeamIdentityCard from './TeamIdentityCard';
import TeamMatchesCard from './TeamMatchesCard';
import TeamRosterCard from './TeamRosterCard';

const TeamBackButton = BackButton as ComponentType<{
  label?: string;
  className?: string;
  iconSize?: number;
  href?: string;
}>;
const TeamSection = Section as unknown as ComponentType<{
  title: string;
  id: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
}>;

export default function TeamProfileClient({ team }: { team: TeamProfileViewModel }) {
  if (!team) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header / Back Link */}
      <FadeIn delay={0}>
        <div className="mb-2 px-4 sm:px-6 lg:px-8 pt-4">
          <TeamBackButton />
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
        <TeamSection
          title="Calendario y Resultados"
          subtitle="Próximos retos y rendimiento en las últimas jornadas."
          id="matches-results"
          delay={150}
        >
          <TeamMatchesCard upcoming={team.upcomingMatches} recent={team.recentMatches} />
        </TeamSection>

        {/* SECTION 2: PLANTILLA Y JUGADORES */}
        <TeamSection
          title="Análisis de Plantilla"
          subtitle="Distribución de jugadores y estatus de propiedad en la liga."
          id="roster-analysis"
          delay={300}
        >
          <TeamRosterCard roster={team.roster} />
        </TeamSection>
      </div>
    </div>
  );
}
