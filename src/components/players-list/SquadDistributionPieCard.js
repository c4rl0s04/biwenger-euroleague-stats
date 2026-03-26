'use client';

import { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import CustomSelect from '@/components/ui/CustomSelect';
import { GlassTooltip, TooltipHeader } from '@/components/ui/Tooltip';

// Fixed colors for positions
const POSITION_COLORS = {
  Base: '#3b82f6', // Blue
  Alero: '#22c55e', // Green
  Pivot: '#ef4444', // Red
};

// Categorical palette for teams
const TEAM_PALETTE = [
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f43f5e',
  '#6366f1',
];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <GlassTooltip className="min-w-[120px] pointer-events-none">
        <TooltipHeader>{data.name}</TooltipHeader>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Jugadores:</span>
          <span className="font-bold text-foreground pl-2">{data.value}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">Porcentaje:</span>
          <span className="font-bold text-primary pl-2">{data.percent}%</span>
        </div>
      </GlassTooltip>
    );
  }
  return null;
};

export default function SquadDistributionPieCard({
  initialPlayers = [],
  owners = [],
  type = 'position',
  title,
  icon: Icon,
}) {
  const [selectedOwnerId, setSelectedOwnerId] = useState('ALL');

  const chartData = useMemo(() => {
    // 1. Filter players for the selected manager
    const squadPlayers =
      selectedOwnerId === 'ALL'
        ? initialPlayers.filter((p) => p.owner_id && p.owner_id !== 0)
        : initialPlayers.filter((p) => String(p.owner_id) === String(selectedOwnerId));

    if (!squadPlayers.length && type !== 'position') return [];

    // 2. Aggregate by type
    const counts = {};
    squadPlayers.forEach((p) => {
      const key = type === 'position' ? p.position : p.team_name;
      counts[key] = (counts[key] || 0) + 1;
    });

    // 3. Format for Recharts
    if (type === 'position') {
      // PRESERVE ORDER AND KEYS FOR SMOOTH ANIMATION
      // Always return all 3 positions in the same order
      return ['Base', 'Alero', 'Pivot'].map((name) => {
        const value = counts[name] || 0;
        return {
          name,
          value,
          percent: squadPlayers.length ? ((value / squadPlayers.length) * 100).toFixed(1) : '0.0',
          color: POSITION_COLORS[name],
        };
      });
    }

    // For Teams: Sort by value to keep some stability, but IDs change
    return Object.entries(counts)
      .map(([name, value], idx) => ({
        name,
        value,
        percent: ((value / squadPlayers.length) * 100).toFixed(1),
        color: TEAM_PALETTE[idx % TEAM_PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [initialPlayers, selectedOwnerId, type]);

  const selectOptions = useMemo(
    () => [
      { value: 'ALL', label: 'Todos' },
      ...owners.map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [owners]
  );

  return (
    <ElegantCard
      title={title}
      icon={Icon}
      color={type === 'position' ? 'purple' : 'emerald'}
      className="h-[520px] flex flex-col"
    >
      <div className="flex-1 flex flex-col pt-2">
        {/* Manager Selector - STATIC WIDTH */}
        <div className="mb-2 px-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Manager
          </p>
          <div className="w-[150px]">
            <CustomSelect
              value={String(selectedOwnerId)}
              onChange={(val) => setSelectedOwnerId(val)}
              options={selectOptions}
            />
          </div>
        </div>

        {/* Chart Container - Side-by-Side Layout */}
        <div className="flex-1 min-h-0 relative -mx-2 mt-4">
          {chartData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="42%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                  isAnimationActive={true}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth={1}
                      className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconSize={10}
                  content={({ payload }) => (
                    <div className="flex flex-col gap-y-4 pr-8 pl-4">
                      {payload.map((entry, index) => {
                        const data = chartData.find((d) => d.name === entry.value);
                        return (
                          <div key={index} className="flex items-center gap-3 group">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">
                                {entry.value}
                              </span>
                              {data && data.value > 0 && (
                                <div className="flex items-baseline gap-1">
                                  <span
                                    className="text-lg font-black tabular-nums leading-none"
                                    style={{ color: entry.color }}
                                  >
                                    {data.value}
                                  </span>
                                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">
                                    Jug.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic opacity-50">
              Sin jugadores en plantilla
            </div>
          )}
        </div>
      </div>
    </ElegantCard>
  );
}
