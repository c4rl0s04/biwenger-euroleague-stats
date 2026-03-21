'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { getColorForUser } from '@/lib/constants/colors';
import { GlassTooltip, TooltipHeader } from '@/components/ui/Tooltip';

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sorted = [...payload].filter((p) => p.value != null).sort((a, b) => a.value - b.value); // ascending = rank 1 first

    return (
      <GlassTooltip className="min-w-[140px] pointer-events-none" showTriangle={false}>
        <TooltipHeader>{label}</TooltipHeader>
        <div className="space-y-1.5">
          {sorted.map((entry, index) => {
            const pos = entry.value;
            const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null;
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-foreground flex-1 truncate max-w-[100px]">{entry.name}</span>
                <span className="font-bold text-foreground ml-auto flex items-center gap-1">
                  {medal && <span className="text-[11px]">{medal}</span>}
                  <span>#{pos}</span>
                </span>
              </div>
            );
          })}
        </div>
      </GlassTooltip>
    );
  }
  return null;
};

// --- Custom Y-Axis Tick (shows ordinal position) ---
const PositionTick = ({ x, y, payload }) => {
  const pos = payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        className="text-slate-300 font-black font-display text-[12px]"
        fill="currentColor"
      >
        #{pos}
      </text>
    </g>
  );
};

export default function PositionEvolutionCard() {
  const { data, loading } = useApiData('/api/standings/advanced?type=position-evolution');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Build chart data: [{ name: "J5", [userId]: position, ... }, ...]
  const { chartData, users } = useMemo(() => {
    if (!data?.users || !data?.rounds) return { chartData: [], users: [] };

    const chartData = data.rounds.map((round, idx) => {
      const entry = {
        name: round.shortName || round.name,
        fullName: round.name,
      };
      data.users.forEach((user) => {
        const histItem = user.history[idx];
        if (histItem) {
          entry[String(user.id)] = histItem.position;
        }
      });
      return entry;
    });

    // Sort users by their final position (ascending = best first)
    const lastIdx = data.rounds.length - 1;
    const sortedUsers = [...data.users].sort((a, b) => {
      const posA = a.history[lastIdx]?.position ?? 999;
      const posB = b.history[lastIdx]?.position ?? 999;
      return posA - posB;
    });

    return { chartData, users: sortedUsers };
  }, [data]);

  const totalUsers = users.length;

  // All selected by default
  const initializedUsers = useMemo(() => new Set(users.map((u) => String(u.id))), [users]);
  const effectiveSelected =
    selectedUsers.size === 0 && users.length > 0 ? initializedUsers : selectedUsers;

  const toggleUser = (userId) => {
    const next = new Set(selectedUsers);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedUsers(next);
  };

  const toggleAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => String(u.id))));
    }
  };

  return (
    <Card
      title="Evolución de Posiciones"
      icon={TrendingUp}
      color="cyan"
      loading={loading}
      info="Evolución del ranking global jornada a jornada. Cada línea representa un participante."
      className="h-full flex flex-col"
    >
      {!loading && data && data.users ? (
        <div className="flex flex-col gap-4">
          {/* Highlights: Mayor Subida / Mayor Caída */}
          {data.valid && (
            <div className="flex items-center gap-4 text-xs px-1">
              {/* Biggest Climber */}
              <div className="flex-1 bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2.5 relative z-10 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                    <TrendingUp size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-emerald-500/60 font-bold block text-[9px] uppercase tracking-wider">
                      Mayor Subida
                    </span>
                    <span className="block font-bold text-slate-200 text-sm leading-tight break-words pr-1">
                      {data.stats?.biggestClimber?.name || '-'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1.5 relative z-10 flex-shrink-0">
                  <span className="px-2 py-1 rounded-md font-extrabold text-sm bg-emerald-500 text-emerald-950 min-w-[3ch] text-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    {data.stats?.biggestClimber?.change > 0
                      ? `+${data.stats.biggestClimber.change}`
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Biggest Faller */}
              <div className="flex-1 bg-red-950/30 border border-red-900/50 rounded-xl p-3 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2.5 relative z-10 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
                    <TrendingDown size={16} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-red-500/60 font-bold block text-[9px] uppercase tracking-wider">
                      Mayor Caída
                    </span>
                    <span className="block font-bold text-slate-200 text-sm leading-tight break-words pr-1">
                      {data.stats?.biggestFaller?.name || '-'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1.5 relative z-10 flex-shrink-0">
                  <span className="px-2 py-1 rounded-md font-extrabold text-sm bg-red-600 text-red-50 min-w-[3ch] text-center shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                    {data.stats?.biggestFaller?.change || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User Toggle Filter */}
          <div className="flex flex-wrap gap-2 px-1">
            <button
              onClick={toggleAll}
              className={`px-3 py-1 text-xs !rounded-full border transition-all cursor-pointer focus:outline-none overflow-hidden ${
                effectiveSelected.size === users.length
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              Todos
            </button>
            {users.map((user) => {
              const colors = getColorForUser(user.id, user.name, user.color_index);
              const isSelected = effectiveSelected.has(String(user.id));
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(String(user.id))}
                  className={`px-3 py-1 text-xs !rounded-full border flex items-center gap-2 transition-all cursor-pointer focus:outline-none overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/50 border-slate-700 text-white'
                      : 'bg-transparent border-slate-800 text-slate-400 opacity-50'
                  }`}
                  style={{
                    borderColor: isSelected ? colors.stroke : undefined,
                    boxShadow: isSelected ? `0 0 10px -4px ${colors.stroke}` : 'none',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? colors.stroke : '#64748b' }}
                  />
                  {user.name}
                </button>
              );
            })}
          </div>

          {/* Line Chart */}
          <div className="h-[420px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 40, right: 16, left: 8, bottom: 30 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-white/5"
                  opacity={1}
                  vertical={false}
                />
                {/* Reference lines for podium cut */}
                <ReferenceLine y={1} stroke="#eab308" strokeDasharray="4 3" opacity={0.3} />
                <ReferenceLine y={3} stroke="#94a3b8" strokeDasharray="4 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  stroke="currentColor"
                  className="text-slate-600"
                  tick={{
                    fill: 'currentColor',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    dy: 10,
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  reversed
                  domain={[1, totalUsers || 10]}
                  ticks={Array.from({ length: totalUsers || 10 }, (_, i) => i + 1)}
                  tick={<PositionTick />}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  content={<CustomTooltip totalUsers={totalUsers} />}
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 3' }}
                  wrapperStyle={{
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }}
                  formatter={(value) => (
                    <span className="text-slate-400 hover:text-white transition-colors ml-1">
                      {value}
                    </span>
                  )}
                />
                {users.map((user) => {
                  const colors = getColorForUser(user.id, user.name, user.color_index);
                  const isSelected = effectiveSelected.has(String(user.id));
                  return (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={String(user.id)}
                      name={user.name}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? 2.5 : 1}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                      hide={!isSelected}
                      isAnimationActive
                      legendType="circle"
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-400 py-12">Cargando datos...</div>
      )}
    </Card>
  );
}
