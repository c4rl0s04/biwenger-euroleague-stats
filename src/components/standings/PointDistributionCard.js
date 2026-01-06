'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import { getColorForUser } from '@/lib/constants/colors';
import Link from 'next/link';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-50 text-xs">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
             <p key={index} style={{ color: entry.color }}>
               {entry.name}: {entry.value} veces
             </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, data }) => {
  const user = data.find(u => u.name === payload.value);
  if (!user) return <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11}>{payload.value}</text>;

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

export default function PointDistributionCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=distribution');

  const chartData = data.map(u => ({
    name: u.name,
    user_id: u.user_id,
    '0-50': u.distribution['0-50'],
    '51-100': u.distribution['51-100'],
    '101-150': u.distribution['101-150'],
    '150+': u.distribution['150+'],
  }));

  return (
    <Card title="Zona de Confort" icon={BarChart2} color="purple" loading={loading} tooltip="Distribución de puntuaciones: ¿En qué rango suelen caer sus puntos?">
      {!loading && chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={90} 
                tick={<CustomYAxisTick data={chartData} />} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="0-50" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
              <Bar dataKey="51-100" stackId="a" fill="#eab308" />
              <Bar dataKey="101-150" stackId="a" fill="#22d3ee" />
              <Bar dataKey="150+" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">Sin datos</div>
      )}
    </Card>
  );
}
