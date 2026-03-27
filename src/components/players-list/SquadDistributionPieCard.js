'use client';

import { useMemo, useState, memo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import CustomSelect from '@/components/ui/CustomSelect';
import { GlassTooltip, TooltipHeader } from '@/components/ui/Tooltip';
import { getTeamColor } from '@/lib/constants/teamColors';

// Fixed colors for positions
const POSITION_COLORS = {
  Base: '#3b82f6', // Blue
  Alero: '#22c55e', // Green
  Pivot: '#ef4444', // Red
};

const CustomPieTooltip = ({ active, payload, type }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <GlassTooltip className="min-w-[160px] pointer-events-none border-white/10">
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-2.5">
            {data.img && (
              <div className="w-6 h-6 rounded-lg bg-white/5 p-1 flex items-center justify-center shrink-0 border border-white/5">
                <img src={data.img} alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/80 leading-tight">
                {type === 'position' ? 'Posición' : 'Equipo'}
              </span>
              <span className="text-sm font-black uppercase tracking-tight text-slate-50 truncate leading-tight">
                {data.name}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Jugadores
            </span>
            <span className="text-sm font-black tabular-nums text-foreground">{data.value}</span>
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

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, img, value }) => {
  if (!img || value === 0) return null;
  const RADIAN = Math.PI / 180;
  // Push labels further out and give them more space for the new larger icons
  const radius = outerRadius + 38;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <image
        x={x - 21}
        y={y - 21}
        width={42}
        height={42}
        href={img}
        filter="url(#shadow)"
        className="animate-in fade-in zoom-in duration-500"
      />
    </g>
  );
};

const SquadDistributionPieCard = memo(function SquadDistributionPieCard({
  initialPlayers = [],
  owners = [],
  type = 'position',
  title,
  icon: Icon,
  onSliceClick,
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

    // For Teams: Sort by value and include img & official color
    return Object.entries(counts)
      .map(([name, value]) => {
        const player = initialPlayers.find((p) => p.team_name === name);
        const teamImg = player?.team_img;
        const teamCode = player?.team_code;

        return {
          name,
          value,
          img: teamImg,
          percent: ((value / squadPlayers.length) * 100).toFixed(1),
          color: getTeamColor(teamCode),
        };
      })
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
      className="h-[750px] flex flex-col"
    >
      <div className="flex-1 flex flex-col pt-2">
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

        <div className="flex-1 min-h-0 relative -mx-2 mt-2">
          {chartData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy={type === 'team' ? '50%' : '48%'}
                  innerRadius={0}
                  outerRadius={type === 'team' ? 190 : 110}
                  paddingAngle={0}
                  dataKey="value"
                  animationDuration={800}
                  isAnimationActive={true}
                  label={type === 'team' ? renderCustomizedLabel : false}
                  labelLine={false}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      stroke="none"
                      onClick={() => onSliceClick?.(entry, selectedOwnerId)}
                      className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip type={type} />} />
                {type === 'position' && (
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    layout="horizontal"
                    iconSize={10}
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-6 px-4 pb-2">
                        {payload.map((entry, index) => {
                          const data = chartData.find((d) => d.name === entry.value);
                          return (
                            <div key={index} className="flex items-center gap-3 shrink-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 leading-none mb-1">
                                  {entry.value}
                                </span>
                                {data && data.value > 0 && (
                                  <span
                                    className="text-lg font-black tabular-nums leading-none"
                                    style={{ color: entry.color }}
                                  >
                                    {data.value}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                )}
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
});

export default SquadDistributionPieCard;
