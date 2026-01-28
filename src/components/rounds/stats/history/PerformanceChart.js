'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { TrendingUp } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * Custom tooltip for the multi-user performance chart
 */
function CustomTooltip({ active, payload, label, metrics }) {
  if (!active || !payload || !payload.length) return null;

  // Group payload by user (prefix in dataKey)
  const userPayloads = payload.reduce((acc, p) => {
    const [userId, metric] = p.dataKey.split('_');
    if (!acc[userId]) acc[userId] = { color: p.color, name: p.name, points: {} };
    // Fix: If the line has legendType="none", p.name might be the raw dataKey or adjusted.
    // We prefer using the name from the "Actual" line which is usually the user's name.
    if (metric === 'actual') acc[userId].name = p.name;

    acc[userId].points[metric] = p.value;
    return acc;
  }, {});

  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl max-w-[250px] z-50">
      <p className="text-xs text-zinc-400 mb-2 border-b border-white/5 pb-1">Jornada {label}</p>
      <div className="space-y-3">
        {Object.entries(userPayloads).map(([userId, data]) => (
          <div key={userId} className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
              <span className="text-xs font-bold text-white">{data.name}</span>
            </div>

            {metrics.actual && data.points.actual !== undefined && (
              <div className="flex justify-between text-xs pl-4">
                <span className="text-zinc-400">Reales:</span>
                <span className="text-white font-mono">{data.points.actual}</span>
              </div>
            )}
            {metrics.ideal && data.points.ideal !== undefined && (
              <div className="flex justify-between text-xs pl-4">
                <span className="text-zinc-400">Ideales:</span>
                <span className="text-white font-mono">{data.points.ideal}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PerformanceChart({
  histories,
  comparisonUsers = [],
  metrics = { actual: true, ideal: false },
}) {
  const chartData = useMemo(() => {
    if (!histories || Object.keys(histories).length === 0) return [];

    const allRounds = new Set();
    Object.values(histories).forEach((history) => {
      if (Array.isArray(history)) {
        history.forEach((r) => allRounds.add(r.round_number));
      }
    });

    const data = Array.from(allRounds)
      .sort((a, b) => a - b)
      .map((roundNum) => {
        const row = { round_number: roundNum };
        comparisonUsers.forEach((user) => {
          const userHistory = histories[user.id];
          const roundData = userHistory?.find((r) => r.round_number === roundNum);
          if (roundData) {
            row[`${user.id}_actual`] = roundData.actual_points;
            row[`${user.id}_ideal`] = roundData.ideal_points;
          }
        });
        return row;
      });

    return data;
  }, [histories, comparisonUsers]);

  if (comparisonUsers.length === 0) {
    return (
      <ElegantCard title="Evolución de Puntos" icon={TrendingUp} color="orange">
        <div className="h-80 flex items-center justify-center text-zinc-500">
          Selecciona usuarios para comparar
        </div>
      </ElegantCard>
    );
  }

  return (
    <ElegantCard title="Evolución de Puntos" icon={TrendingUp} color="orange">
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            {/* Removed CartesianGrid as requested */}

            <XAxis
              dataKey="round_number"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={false}
              dx={-10}
            />

            <Tooltip content={<CustomTooltip metrics={metrics} />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} iconType="circle" />

            {comparisonUsers.map((user, index) => {
              // 1. Get consistent color from constants
              const userColor = getColorForUser(user.id, user.name, user.color_index);
              const strokeColor = userColor.stroke;

              return (
                <g key={user.id}>
                  {/* Actual Points: Solid, Thicker, No Dots */}
                  {metrics.actual && (
                    <Line
                      type="monotone"
                      dataKey={`${user.id}_actual`}
                      name={user.name}
                      stroke={strokeColor}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
                      connectNulls
                    />
                  )}

                  {/* Ideal Points: Dashed, Thinner, No Dots, No Legend Entry */}
                  {metrics.ideal && (
                    <Line
                      type="monotone"
                      dataKey={`${user.id}_ideal`}
                      name={metrics.actual ? `${user.name} (Ideal)` : user.name}
                      stroke={strokeColor}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
                      legendType={metrics.actual ? 'none' : 'circle'} // Only hide if Actual is visible
                      connectNulls
                    />
                  )}
                </g>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ElegantCard>
  );
}
