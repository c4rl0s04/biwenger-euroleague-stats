'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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
    data.forEach(user => {
      user.data.forEach(point => {
        if (!roundsMap.has(point.round)) {
          roundsMap.set(point.round, { round: point.round });
        }
        roundsMap.get(point.round)[user.name] = point.avg;
      });
    });
    chartData.push(...Array.from(roundsMap.values()).sort((a, b) => a.round - b.round));
  }

  return (
    <Card title="Media Móvil (3 Jornadas)" icon={Activity} color="indigo" loading={loading} tooltip="Tendencia de puntuación suavizada (media de las últimas 3 jornadas) para eliminar el ruido de una jornada puntual.">
      {!loading && chartData.length > 0 ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="round" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                itemStyle={{ padding: 0 }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
              {data.map((user) => {
                const colors = getColorForUser(user.user_id, user.name);
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
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">No hay historial suficiente</div>
      )}
    </Card>
  );
}
