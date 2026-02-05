'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { User, Activity, Euro } from 'lucide-react';

const COLORS = {
  Unknown: '#64748b',
  B: '#3b82f6', // Base - Blue
  A: '#10b981', // Alero - Emerald
  P: '#ef4444', // Pivot - Red
  AP: '#f97316', // Ala-Pivot - Orange
  E: '#6366f1', // Escolta? Or whatever position code - Indigo
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-2 shadow-xl z-50 text-xs">
      <p className="border-b border-white/5 pb-1 mb-1 font-bold text-white">{data.position}</p>
      <p className="text-zinc-300">
        Fichajes: <span className="text-white font-mono">{data.count}</span>
      </p>
      <p className="text-zinc-300">
        Volumen:{' '}
        <span className="text-white font-mono">{(data.total_volume / 1000000).toFixed(1)}M €</span>
      </p>
    </div>
  );
}

export default function PositionAnalysisGrid({ positionStats }) {
  if (!positionStats || !positionStats.distribution.length) return null;

  const { mostSigned, distribution } = positionStats;
  const processedDist = distribution.map((d) => ({
    ...d,
    color: COLORS[d.position] || COLORS.Unknown,
  }));

  // Helper for currency
  const fmt = (val) => val.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Stats Column */}
      <div className="lg:col-span-1 space-y-6">
        {/* Most Signed Position */}
        {mostSigned && (
          <ElegantCard title="Posición Más Fichada" icon={Activity} color="orange">
            <div className="flex justify-between items-center mt-2">
              <span className="text-4xl font-extrabold text-white">{mostSigned.position}</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-400 leading-none">
                  {mostSigned.count}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Fichajes</p>
              </div>
            </div>
          </ElegantCard>
        )}

        {/* Price by Position Table */}
        <ElegantCard title="Precio Medio" icon={Euro} color="emerald">
          <div className="space-y-3 mt-2">
            {distribution.map((pos) => (
              <div
                key={pos.position}
                className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[pos.position] || '#666' }}
                  />
                  <span className="font-bold text-zinc-300 w-6">{pos.position}</span>
                </div>
                <span className="font-mono text-emerald-400">{fmt(pos.avg_price)} €</span>
              </div>
            ))}
          </div>
        </ElegantCard>
      </div>

      {/* 2. Chart Card */}
      <div className="lg:col-span-2">
        <ElegantCard
          title="Distribución por Posición"
          icon={User}
          color="blue"
          className="h-full min-h-[300px]"
        >
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedDist}
                  dataKey="count"
                  nameKey="position"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                >
                  {processedDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ElegantCard>
      </div>
    </div>
  );
}
