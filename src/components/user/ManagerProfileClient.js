'use client';

import {
  TrendingUp,
  BarChart3,
  PieChart,
  History,
  Calendar,
  LayoutGrid,
  Activity,
  Users,
  Briefcase,
  LineChart,
  Clock,
} from 'lucide-react';
import { FadeIn, BackButton, PageHeader, ElegantCard } from '@/components/ui';
import Section from '@/components/layout/Section';
import ManagerIdentityCard from './ManagerIdentityCard';
import SeasonRecordsCard from './SeasonRecordsCard';
import MarketActivityCard from './MarketActivityCard';
import LeagueDominanceCard from './LeagueDominanceCard';
import UserTournamentsCard from './UserTournamentsCard';
import UserTrophyCabinetCard from './UserTrophyCabinetCard';
import UserSquadAnalysisCard from './UserSquadAnalysisCard';
import PointsEvolutionChart from './PointsEvolutionChart';
import UserTopContributorsCard from './UserTopContributorsCard';

export default function ManagerProfileClient({
  stats,
  squad,
  recentRounds,
  tournaments,
  topContributors,
}) {
  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header / Back Link */}
      <FadeIn delay={0}>
        <div className="mb-2 px-4 sm:px-6 lg:px-8 pt-4">
          <BackButton />
        </div>
      </FadeIn>

      <PageHeader
        title={`Perfil de ${stats.name}`}
        description="Análisis detallado del rendimiento, plantilla y movimientos de mercado."
        className="!pt-2"
      />

      {/* Hero Section */}
      <FadeIn delay={100} className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="w-full">
          <ManagerIdentityCard stats={stats} />
        </div>
      </FadeIn>

      {/* SECTION 1: RENDIMIENTO DE TEMPORADA */}
      <Section
        title="Rendimiento de Temporada"
        subtitle="Estadísticas acumuladas y hitos logrados."
        id="season-performance"
        delay={150}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SeasonRecordsCard stats={stats} />
          <MarketActivityCard stats={stats} />
          <LeagueDominanceCard userId={stats.id} />
        </div>
      </Section>

      {/* SECTION 2: PLANTILLA ACTUAL */}
      <Section
        title="Análisis de Plantilla"
        subtitle="Composición actual del equipo y valor de mercado."
        id="squad-analysis"
        delay={300}
      >
        <UserSquadAnalysisCard squad={squad} />
      </Section>

      {/* SECTION 3: EVOLUCIÓN Y TENDENCIAS */}
      <Section
        title="Evolución de Puntuación"
        subtitle="Seguimiento de puntos jornada a jornada."
        id="points-evolution"
        delay={450}
      >
        <PointsEvolutionChart recentRounds={recentRounds} />
      </Section>

      {/* SECTION 4: MÁXIMOS CONTRIBUIDORES */}
      <Section
        title="Máximos Contribuidores"
        subtitle="Los jugadores que más puntos han aportado al equipo mientras han estado alineados."
        id="top-contributors"
        delay={600}
      >
        <UserTopContributorsCard contributors={topContributors} />
      </Section>

      {/* SECTION 5: COMPETICIONES */}
      <Section
        title="Competiciones y Copas"
        subtitle="Rendimiento en porras y torneos eliminatorios."
        id="tournaments"
        delay={750}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UserTournamentsCard tournaments={tournaments} />
          <UserTrophyCabinetCard stats={stats} tournaments={tournaments} />
        </div>
      </Section>
    </div>
  );
}
