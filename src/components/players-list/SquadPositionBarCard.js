'use client';

import { useMemo, useState, memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { Target } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import CustomSelect from '@/components/ui/CustomSelect';
import { GlassTooltip } from '@/components/ui/Tooltip';

// Fixed colors for positions
const POSITION_COLORS = {
  Base: '#3b82f6', // Blue
  Alero: '#22c55e', // Green
  Pivot: '#ef4444', // Red
};

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <GlassTooltip className="min-w-[160px] pointer-events-none border-white/10">
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/80 leading-tight">
              Análisis Táctico
            </span>
            <span className="text-sm font-black uppercase tracking-tight text-slate-50 truncate leading-tight">
              Distribución de {data.name}s
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Jugadores
            </span>
            <span className="text-sm font-black tabular-nums text-foreground">
              {data.playerCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Porcentaje
            </span>
            <span className="text-sm font-black tabular-nums text-primary">{data.percent}%</span>
          </div>
        </div>
      </GlassTooltip>
    );
  }
  return null;
};

const RenderCustomLabel = (props) => {
  const { x, y, width, value } = props;
  return (
    <g>
      <text
        x={x + width / 2}
        y={y - 12}
        fill="white"
        textAnchor="middle"
        className="text-[18px] font-black italic tracking-tighter tabular-nums"
      >
        {value}
      </text>
    </g>
  );
};

const SquadPositionBarCard = memo(function SquadPositionBarCard({
  initialPlayers = [],
  owners = [],
  title,
  icon: Icon,
  onSliceClick,
}) {
  const [selectedOwnerId, setSelectedOwnerId] = useState('ALL');

  const chartData = useMemo(() => {
    const squadPlayers =
      selectedOwnerId === 'ALL'
        ? initialPlayers.filter((p) => p.owner_id && p.owner_id !== 0)
        : initialPlayers.filter((p) => String(p.owner_id) === String(selectedOwnerId));

    if (!squadPlayers.length) return [];

    const counts = {};
    squadPlayers.forEach((p) => {
      counts[p.position] = (counts[p.position] || 0) + 1;
    });

    return ['Base', 'Alero', 'Pivot'].map((name) => {
      const count = counts[name] || 0;
      return {
        name,
        playerCount: count,
        percent: squadPlayers.length ? ((count / squadPlayers.length) * 100).toFixed(1) : '0.0',
        fill: POSITION_COLORS[name],
      };
    });
  }, [initialPlayers, selectedOwnerId]);

  const selectOptions = useMemo(
    () => [
      { value: 'ALL', label: 'Todos' },
      ...owners.map((o) => ({ value: String(o.id), label: o.name })),
    ],
    [owners]
  );

  return (
    <ElegantCard title={title} icon={Icon} color="purple" className="h-[750px] flex flex-col">
      <div className="flex-1 flex flex-col pt-2">
        {/* Manager Selector */}
        <div className="mb-4 px-1 pb-4 border-b border-border/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
            Manager
          </p>
          <div className="w-[220px]">
            <CustomSelect
              value={String(selectedOwnerId)}
              onChange={(val) => setSelectedOwnerId(val)}
              options={selectOptions}
            />
          </div>
        </div>

        {/* Vertical Bar Chart Section - Maximum Height */}
        <div className="flex-1 min-h-0 relative pr-4 pb-0">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="98%">
              <BarChart data={chartData} margin={{ top: 30, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={(props) => (
                    <text
                      x={props.x}
                      y={props.y + 16}
                      textAnchor="middle"
                      fill="white"
                      className="text-[14px] font-black uppercase italic tracking-[0.1em]"
                    >
                      {props.payload.value}
                    </text>
                  )}
                />
                <YAxis type="number" hide domain={[0, 'auto']} />
                <Tooltip
                  content={<CustomBarTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar
                  dataKey="playerCount"
                  radius={[8, 8, 0, 0]}
                  barSize={64}
                  onClick={(entry) => onSliceClick?.(entry, selectedOwnerId)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="playerCount" content={<RenderCustomLabel />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic opacity-50">
              Sin jugadores en plantilla
            </div>
          )}
        </div>

        {/* Perfectly Aligned Tactical Footer - Single Line for clarity */}
        <div className="mt-auto p-12 pt-0 flex justify-center">
          <div className="flex items-center justify-center gap-4 w-full max-w-[240px] py-4 px-8 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(250,80,1,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary italic leading-none relative z-10">
              TOTAL JUGADORES
            </span>
            <span className="text-2xl font-black italic tabular-nums text-foreground leading-none tracking-tight relative z-10">
              {initialPlayers.filter((p) => p.owner_id && p.owner_id !== 0).length}
            </span>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
});

export default SquadPositionBarCard;
