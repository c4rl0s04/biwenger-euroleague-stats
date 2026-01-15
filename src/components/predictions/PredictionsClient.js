'use client';

import { useState } from 'react';
import { Title } from '@/components/ui';
import { FadeIn } from '@/components/ui';
import {
  Perfect10Card,
  BlankedCard,
  ClutchCard,
  VictoriasCard,
  BestRoundCard,
  BestAverageCard,
} from './StatsCards';
import { PerformanceChart, ParticipationChart } from './PredictionsCharts';
import { StatsTable, HistoryTable } from './PredictionsTables';
import { ClutchModal, VictoriasModal } from './PredictionsModals';
import { TrendingUp, Users } from 'lucide-react';

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
    <div className="space-y-8 pb-12">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FadeIn delay={0.1}>
          <Perfect10Card achievements={achievements} />
        </FadeIn>
        <FadeIn delay={0.2}>
          <BlankedCard achievements={achievements} />
        </FadeIn>
        <FadeIn delay={0.3}>
          <ClutchCard clutchStats={clutch_stats} onClick={() => setIsClutchOpen(true)} />
        </FadeIn>
        <FadeIn delay={0.4}>
          <VictoriasCard
            victorias={porra_stats?.victorias}
            onClick={() => setIsVictoriasOpen(true)}
          />
        </FadeIn>

        {/* Row 2 */}
        <div className="col-span-1 sm:col-span-2 h-full">
          <FadeIn delay={0.5} className="h-full">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm h-full flex flex-col hover:border-border transition-colors group">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-500" />
                Participación
              </h2>
              <ParticipationChart data={participation} />
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.6}>
          <BestRoundCard bestStats={porra_stats?.mejor_jornada} />
        </FadeIn>

        <FadeIn delay={0.7}>
          <BestAverageCard promedios={porra_stats?.promedios} />
        </FadeIn>
      </div>

      {/* Performance Chart */}
      <FadeIn delay={0.8}>
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm hover:border-border transition-colors">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Evolución de Aciertos
          </h2>
          <PerformanceChart data={performance} />
        </div>
      </FadeIn>

      {/* Detailed Stats Table */}
      <FadeIn delay={0.9}>
        <StatsTable data={table_stats} />
      </FadeIn>

      {/* Historical Table */}
      <FadeIn delay={1.0}>
        <HistoryTable history={history} />
      </FadeIn>

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
