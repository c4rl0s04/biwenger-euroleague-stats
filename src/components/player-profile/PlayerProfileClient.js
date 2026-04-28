'use client';

import {
  TrendingUp,
  BarChart3,
  PieChart,
  History,
  Calendar,
  LayoutGrid,
  Activity,
} from 'lucide-react';
import { FadeIn, BackButton } from '@/components/ui';
import Section from '@/components/layout/Section';
import {
  PlayerIdentityCard,
  PlayerMarketCard,
  PlayerStatsCard,
  PlayerHistoryCard,
  PlayerNextMatchCard,
  PlayerPriceHistoryCard,
  PlayerAdvancedStatsCard,
  PlayerOwnershipCard,
  PlayerPointsGraph,
  PlayerSplitsCard,
} from '@/components/player-profile';

export default function PlayerProfileClient({ player }) {
  if (!player) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header / Back Link */}
      <FadeIn delay={0}>
        <div className="mb-4 px-4 sm:px-6 lg:px-8">
          <BackButton />
        </div>
      </FadeIn>

      {/* Hero Section */}
      <FadeIn delay={100} className="px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <PlayerIdentityCard player={player} />
        </div>
      </FadeIn>

      {/* SECTION 1: ESTADO ACTUAL */}
      <Section
        title="Situación y Rendimiento"
        subtitle="Próximo partido, mercado y estadísticas generales."
        delay={150}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-full">
            <PlayerNextMatchCard nextMatch={player.nextMatch} playerTeam={player.team_name} />
          </div>
          <div className="h-full">
            <PlayerMarketCard player={player} />
          </div>
          <div className="h-full">
            <PlayerStatsCard player={player} />
          </div>
        </div>
      </Section>

      {/* SECTION 2: EVOLUCIÓN DE MERCADO */}
      <Section
        title="Evolución de Valor"
        subtitle="Seguimiento histórico del precio en el mercado."
        delay={300}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <PlayerPriceHistoryCard priceHistory={player.priceHistory} playerPrice={player.price} />
          </div>
        </div>
      </Section>

      {/* SECTION 3: MÉTRICAS AVANZADAS */}
      <Section
        title="Estadísticas Avanzadas"
        subtitle="Desglose detallado de métricas y eficiencia."
        delay={400}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <PlayerAdvancedStatsCard advancedStats={player.advancedStats} />
          </div>
        </div>
      </Section>

      {/* SECTION 4: ANÁLISIS DE PUNTOS */}
      <Section
        title="Análisis de Puntuación"
        subtitle="Tendencias recientes y distribución por condición."
        delay={450}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PlayerPointsGraph matches={player.recentMatches} playerTeam={player.team_name} />
          </div>
          <div className="lg:col-span-1">
            <PlayerSplitsCard matches={player.recentMatches} playerTeam={player.team_name} />
          </div>
        </div>
      </Section>

      {/* SECTION 5: HISTORIAL DE TRASPASOS */}
      {player.transfers && player.transfers.length > 0 && (
        <Section
          title="Historial de Traspasos"
          subtitle="Cronología de movimientos entre managers."
          delay={550}
        >
          <div className="grid grid-cols-1">
            <PlayerOwnershipCard transfers={player.transfers} />
          </div>
        </Section>
      )}

      {/* SECTION 6: HISTORIAL DE PARTIDOS */}
      <Section
        title="Registro de Partidos"
        subtitle="Actuaciones detallada jornada a jornada."
        delay={600}
      >
        <div className="grid grid-cols-1">
          <PlayerHistoryCard recentMatches={player.recentMatches} playerTeam={player.team_name} />
        </div>
      </Section>
    </div>
  );
}
