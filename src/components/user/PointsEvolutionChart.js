'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
  Cell,
} from 'recharts';
import { ElegantCard } from '@/components/ui';
import { GlassTooltip, TooltipHeader } from '@/components/ui/Tooltip';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useMemo } from 'react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <GlassTooltip className="min-w-[180px] pointer-events-none">
        <TooltipHeader>{item.fullName}</TooltipHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/60">Puntos:</span>
            <span className="text-base font-black text-cyan-400">{item.puntos} pts</span>
          </div>
          {item.participated && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/60">Posición:</span>
              <span className="text-base font-black text-amber-400">#{item.posicion}</span>
            </div>
          )}
        </div>
      </GlassTooltip>
    );
  }
  return null;
};

export default function PointsEvolutionChart({ recentRounds }) {
  const data = useMemo(() => {
    if (!recentRounds || !recentRounds.rounds) return [];
    // Reverse rounds to show them from oldest to newest for the chart
    return [...recentRounds.rounds].reverse().map((r) => ({
      name: r.round_name.replace('Jornada ', 'J').replace('Eliminatoria ', 'E'),
      fullName: r.round_name,
      puntos: r.points,
      posicion: r.position,
      participated: r.participated === 1,
    }));
  }, [recentRounds]);

  const stats = useMemo(() => {
    const participatedRounds = data.filter((d) => d.participated);

    if (participatedRounds.length === 0) {
      return { best: 0, worst: 0, mean: 0 };
    }

    const points = participatedRounds.map((d) => d.puntos);
    const total = points.reduce((sum, p) => sum + p, 0);

    return {
      best: Math.max(...points),
      worst: Math.min(...points),
      mean: (total / participatedRounds.length).toFixed(1),
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <ElegantCard title="Evolución de Puntuación" icon={LineChartIcon} color="cyan">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-white/40 italic">No hay datos de jornadas recientes.</p>
        </div>
      </ElegantCard>
    );
  }

  return (
    <ElegantCard
      title="Evolución de Puntuación"
      icon={LineChartIcon}
      color="cyan"
      className="overflow-hidden relative group"
    >
      <div className="relative z-10">
        <div className="h-[340px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {data.map((entry, index) => {
                  const range = stats.best - stats.worst;
                  const percent = range > 0 ? (entry.puntos - stats.worst) / range : 1;
                  const hue = percent * 135;
                  const colorTop = `hsl(${hue}, 75%, 45%)`;
                  const colorBottom = `hsl(${hue}, 80%, 20%)`;
                  return (
                    <linearGradient
                      key={`grad-${index}`}
                      id={`bar-grad-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={colorTop} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={colorBottom} stopOpacity={0.4} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="rgba(255,255,255,0.03)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 900 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#ffffff', fontSize: 11, fontWeight: 900 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

              <ReferenceLine
                y={stats.mean}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="6 6"
                strokeWidth={1.5}
                label={{
                  value: `MEDIA: ${stats.mean}`,
                  position: 'right',
                  fill: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 10,
                  fontWeight: 900,
                  offset: 20,
                  className: 'drop-shadow-[0_0_5px_rgba(0,0,0,0.5)] font-display',
                }}
              />

              <Bar dataKey="puntos" radius={[6, 6, 0, 0]} animationDuration={1500}>
                {data.map((entry, index) => {
                  if (!entry.participated) {
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill="rgba(255, 255, 255, 0.03)"
                        className="transition-all duration-300"
                      />
                    );
                  }

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#bar-grad-${index})`}
                      className="transition-all duration-500 hover:brightness-150 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    />
                  );
                })}
                <LabelList
                  dataKey="puntos"
                  position="top"
                  fill="rgba(255,255,255,0.9)"
                  fontSize={11}
                  fontWeight={900}
                  fontFamily="inherit"
                  offset={10}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ElegantCard>
  );
}
