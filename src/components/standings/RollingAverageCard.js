'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Activity } from 'lucide-react';
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

export default function RollingAverageCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=rolling-avg');

  // Transform data for Recharts: Flatten to one array of round objects with user keys
  /*
    Input: [{ user_id, name, data: [{ round, avg }] }]
    Output: [{ round: 1, user1: 45, user2: 50 }, ...]
  */
  const chartData = [];
  if (data.length > 0) {
    const roundsMap = new Map();
    data.forEach((user) => {
      user.data.forEach((point) => {
        if (!roundsMap.has(point.round)) {
          // Use J + number as requested
          const label = point.round_name
            ? point.round_name.replace('Jornada ', 'J')
            : `J${point.round}`;

          roundsMap.set(point.round, {
            round: point.round,
            label: label,
          });
        }
        roundsMap.get(point.round)[user.name] = point.avg;
      });
    });
    chartData.push(...Array.from(roundsMap.values()).sort((a, b) => a.round - b.round));
  }

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
          <p className="text-[11px] text-slate-500 italic px-2 text-center font-medium">
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
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 pointer-events-none ring-1 ring-white/5 min-w-[180px]">
                          <p className="text-slate-500 text-[10px] mb-3 font-black tracking-[0.15em] uppercase font-display">
                            {label}
                          </p>
                          <div className="space-y-1.5">
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2.5 text-xs">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-300 flex-1 truncate max-w-[110px]">
                                  {entry.name}
                                </span>
                                <span className="text-white font-bold ml-auto tabular-nums">
                                  {entry.value?.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '10px',
                    paddingTop: '15px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                  formatter={(value) => <span className="text-slate-500 ml-1">{value}</span>}
                  iconType="circle"
                />
                {data.map((user) => {
                  const colors = getColorForUser(user.user_id, user.name, user.color_index);
                  return (
                    <Line
                      key={user.user_id}
                      type="monotone"
                      dataKey={user.name}
                      stroke={colors.stroke}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center text-slate-500 py-4">No hay historial suficiente</div>
        )
      )}
    </Card>
  );
}
