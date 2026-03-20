'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Activity } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { getColorForUser } from '@/lib/constants/colors';
import { GlassTooltip } from '@/components/ui/Tooltip';

export default function RollingAverageCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=rolling-avg');
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Transform data for Recharts: Flatten to one array of round objects with user keys
  const { chartData, users } = useMemo(() => {
    if (!data.length) return { chartData: [], users: [] };

    const roundsMap = new Map();
    const userList = data.map((u) => ({
      id: String(u.user_id),
      name: u.name,
      color_index: u.color_index,
    }));

    data.forEach((user) => {
      user.data.forEach((point) => {
        if (!roundsMap.has(point.round)) {
          roundsMap.set(point.round, {
            round: point.round,
            label: point.short_name || `J${point.round}`,
            fullName: point.round_name || `Jornada ${point.round}`,
          });
        }
        roundsMap.get(point.round)[user.name] = point.avg;
      });
    });

    const sortedData = Array.from(roundsMap.values()).sort((a, b) => a.round - b.round);
    return { chartData: sortedData, users: userList };
  }, [data]);

  // Handle user selection
  const initializedUsers = useMemo(() => new Set(users.map((u) => u.id)), [users]);
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
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  return (
    <Card
      title="Media Móvil (3 Jornadas)"
      icon={Activity}
      color="indigo"
      loading={loading}
      tooltip="Tendencia de puntuación suavizada (media de las últimas 3 jornadas) para eliminar el ruido de una jornada puntual."
    >
      {!loading && chartData.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[11px] text-slate-400 italic px-2 text-center font-medium">
            Media de puntos de las últimas 3 jornadas. Ayuda a identificar
            <span className="text-primary font-black not-italic ml-1 uppercase tracking-tighter">
              rachas
            </span>{' '}
            y
            <span className="text-primary font-black not-italic ml-1 uppercase tracking-tighter">
              tendencias
            </span>
            .
          </p>

          {/* User Filter (Added for consistency with other charts) */}
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
              const isSelected = effectiveSelected.has(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
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

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-white/5"
                  opacity={1}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  className="text-slate-600"
                  tick={{
                    fill: 'currentColor',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-slate-600"
                  tick={{
                    fill: 'currentColor',
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                  }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <GlassTooltip className="min-w-[180px] pointer-events-none">
                          <p className="text-muted-foreground text-xs mb-3 font-black tracking-[0.1em] uppercase font-display border-b border-white/5 pb-2">
                            {payload[0]?.payload?.fullName || label}
                          </p>
                          <div className="space-y-1.5">
                            {payload
                              .sort((a, b) => b.value - a.value)
                              .map((entry, index) => (
                                <div key={index} className="flex items-center gap-2.5 text-xs">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-foreground flex-1 truncate max-w-[110px]">
                                    {entry.name}
                                  </span>
                                  <span className="text-foreground font-bold ml-auto tabular-nums">
                                    {entry.value?.toFixed(1)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </GlassTooltip>
                      );
                    }
                    return null;
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
                {data.map((user) => {
                  const colors = getColorForUser(user.user_id, user.name, user.color_index);
                  const isSelected = effectiveSelected.has(String(user.user_id));
                  return (
                    <Line
                      key={user.user_id}
                      type="monotone"
                      dataKey={user.name}
                      stroke={colors.stroke}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      hide={!isSelected}
                      connectNulls
                      isAnimationActive
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center text-slate-400 py-4">No hay historial suficiente</div>
        )
      )}
    </Card>
  );
}
