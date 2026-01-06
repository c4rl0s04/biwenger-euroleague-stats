'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Goal } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

import { getColorForUser } from '@/lib/constants/colors';
import Link from 'next/link';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-50 text-xs">
        <p className="font-bold text-slate-200">{data.name}</p>
        <p className="text-slate-400">Total Actual: {data.current_points}</p>
        <p className="text-yellow-400">Gap Teórico: -{data.gap}</p>
        <p className="text-emerald-400">Eficiencia: {data.pct.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, data }) => {
  const user = data.find((u) => u.name === payload.value);
  if (!user)
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11}>
        {payload.value}
      </text>
    );

  const userColor = getColorForUser(user.user_id, user.name);

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-150} y={-10} width={145} height={20}>
        <div className="flex justify-end items-center h-full pr-1">
          <Link
            href={`/user/${user.user_id}`}
            className={`text-[11px] font-medium text-slate-400 ${userColor.hover} transition-colors truncate text-right w-full block`}
            title={user.name}
          >
            {user.name}
          </Link>
        </div>
      </foreignObject>
    </g>
  );
};

export default function TheoreticalGapCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=theoretical-gap');

  return (
    <Card
      title="Gap Teórico (Eficiencia)"
      icon={Goal}
      color="emerald"
      loading={loading}
      tooltip="Distancia acumulada respecto a la 'Temporada Perfecta' (suma de los ganadores de cada jornada)."
    >
      {!loading && data.length > 0 ? (
        <div className="h-72 w-full">
          <div className="text-center text-xs text-yellow-500/80 mb-2 font-mono">
            Puntuación Perfecta Posible: {data[0].perfectTotal}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={90}
                tick={<CustomYAxisTick data={data} />}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="pct" barSize={15} radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`rgba(16, 185, 129, ${entry.pct / 100})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">No hay datos</div>
      )}
    </Card>
  );
}
