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
import { StatsTable } from './tables/StatsTable';
import { HistoryTable } from './tables/HistoryTable';
import { ClutchModal, VictoriasModal } from './PredictionsModals';

export default function PredictionsClient({ stats }) {
  const [isClutchOpen, setIsClutchOpen] = useState(false);
  const [isVictoriasOpen, setIsVictoriasOpen] = useState(false);

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
          <ClutchCard clutchStats={clutch_stats} onClick={() => setIsClutchOpen(true)} />
          <VictoriasCard
            victorias={porra_stats?.victorias}
            onClick={() => setIsVictoriasOpen(true)}
          />

          {/* Row 2 */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 h-full">
            <ParticipationCard data={participation} />
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
        <StatsTable data={table_stats} />
      </Section>

      {/* Section: Predicciones por equipo */}
      <Section title="Predicciones Por Equipo" delay={300} background="section-raised">
        <PredictableTeamsCard teams={porra_stats?.predictable_teams} />
      </Section>

      {/* Section: Historial */}
      <Section title="Historial Completo" delay={400} background="section-base">
        <HistoryTable history={history} />
      </Section>

      {/* Modals */}
      <ClutchModal
        isOpen={isClutchOpen}
        onClose={() => setIsClutchOpen(false)}
        stats={clutch_stats}
      />
      <VictoriasModal
        isOpen={isVictoriasOpen}
        onClose={() => setIsVictoriasOpen(false)}
        victorias={porra_stats?.victorias || []}
      />
    </div>
  );
}
