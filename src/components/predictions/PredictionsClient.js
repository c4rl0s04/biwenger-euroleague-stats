'use client';

import { useState } from 'react';
import { Title } from '@/components/ui';
import { Section } from '@/components/layout';
import {
  Perfect10Card,
  BlankedCard,
  ClutchCard,
  VictoriasCard,
  BestAverageCard,
  PerformanceCard,
  ParticipationCard,
  PredictableTeamsCard,
} from './cards';
import { PredictionsStatsTable } from './tables/PredictionsStatsTable';
import { HistoryTable } from './tables/HistoryTable';
import PredictionsDrawer from './PredictionsDrawer';

export default function PredictionsClient({ stats }) {
  const [drawerType, setDrawerType] = useState(null); // 'clutch' | 'victorias' | null
  const isDrawerOpen = drawerType !== null;

  if (!stats) return null;

  const {
    achievements,
    participation,
    table_stats,
    performance,
    history,
    clutch_stats,
    porra_stats,
  } = stats;

  return (
    <div className="space-y-0 pb-0">
      {/* Section: Resumen General */}
      <Section title="Resumen General" delay={0} background="section-base">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Perfect10Card achievements={achievements} />
          <BlankedCard achievements={achievements} />
          <ClutchCard clutchStats={clutch_stats} onClick={() => setDrawerType('clutch')} />
          <VictoriasCard
            victorias={porra_stats?.victorias}
            onClick={() => setDrawerType('victorias')}
          />

          {/* Row 2 */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 h-full">
            <ParticipationCard data={participation} totalUsers={table_stats?.length || 0} />
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1 h-full space-y-4">
            <BestAverageCard promedios={porra_stats?.promedios} />
          </div>
        </div>
      </Section>

      {/* Section: Evolución */}
      <Section title="Evolución" delay={100} background="section-raised">
        <PerformanceCard data={performance} />
      </Section>

      {/* Section: Clasificación */}
      <Section title="Clasificación Detallada" delay={200} background="section-base">
        <PredictionsStatsTable data={table_stats} />
      </Section>

      {/* Section: Predicciones por equipo */}
      <Section title="Predicciones Por Equipo" delay={300} background="section-raised">
        <PredictableTeamsCard teams={porra_stats?.predictable_teams} />
      </Section>

      {/* Section: Historial */}
      <Section title="Historial Completo" delay={400} background="section-base">
        <HistoryTable history={history} />
      </Section>

      {/* Rankings Drawer */}
      <PredictionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerType(null)}
        type={drawerType}
        clutchStats={clutch_stats}
        victoriasStats={porra_stats?.victorias || []}
      />
    </div>
  );
}
