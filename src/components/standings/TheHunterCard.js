'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Crosshair } from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-50 text-xs">
        <p className="font-bold text-slate-200">{label}</p>
        <p className={payload[0].value > 0 ? 'text-green-400' : 'text-red-400'}>
          {payload[0].value > 0 ? `Recortados: ${payload[0].value}` : `Perdidos: ${Math.abs(payload[0].value)}`} pts
        </p>
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

export default function TheHunterCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=hunter');

  return (
    <Card title="El Cazador" icon={Crosshair} color="red" loading={loading} tooltip="Puntos recortados (o perdidos) respecto al líder en las últimas 5 jornadas.">
      {!loading && data.length > 0 ? (
        <div className="h-64 w-full">
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
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <ReferenceLine x={0} stroke="#475569" />
              <Bar dataKey="gained" radius={[4, 4, 4, 4]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.gained > 0 ? '#4ade80' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">No hay datos de persecución</div>
      )}
    </Card>
  );
}
