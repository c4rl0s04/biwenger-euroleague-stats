'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui';
import { GlassTooltip, TooltipHeader } from '@/components/ui/Tooltip';

/**
 * CustomTooltip for Participation Chart
 */
const CustomTooltip = ({ active, payload, totalUsers }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = payload[0].fill;

    return (
      <GlassTooltip className="min-w-[180px]">
        <TooltipHeader>{data.fullName}</TooltipHeader>
        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-zinc-400 font-medium">Managers</span>
          </div>
          <span className="text-white font-black text-base tabular-nums">
            {data.count}
            <span className="text-[10px] text-zinc-500 ml-1 font-bold">/ {totalUsers}</span>
          </span>
        </div>
      </GlassTooltip>
    );
  }
  return null;
};

export function ParticipationCard({ data, totalUsers }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data]
      .sort((a, b) => {
        const numA = parseInt(a.jornada.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.jornada.replace(/\D/g, '')) || 0;
        return numA - numB;
      })
      .map((d) => ({
        name: d.jornada.replace(/Round |Jornada /i, 'J'),
        fullName: d.jornada,
        count: d.count,
      }));
  }, [data]);

  const getBarColor = (count) => {
    const ratio = totalUsers > 0 ? count / totalUsers : 0;
    if (ratio >= 0.95) return '#012A4A';
    if (ratio >= 0.75) return '#01497C';
    if (ratio >= 0.55) return '#2A6F97';
    if (ratio >= 0.35) return '#468FAF';
    return '#89C2D9';
  };

  return (
    <Card title="Participación" icon={Users} color="blue" className="h-full">
      <div className="h-[250px] w-full mt-4">
        {chartData.length === 0 || totalUsers === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 italic text-sm">
            Sin datos de participación
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -35, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#3f3f46"
                opacity={0.2}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
                domain={[0, totalUsers]}
                allowDecimals={false}
                ticks={Array.from({ length: totalUsers + 1 }, (_, i) => i)}
              />
              <Tooltip
                content={<CustomTooltip totalUsers={totalUsers} />}
                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                barSize={24}
                animationDuration={1500}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.count)}
                    style={{ filter: `drop-shadow(0 0 6px ${getBarColor(entry.count)}40)` }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
