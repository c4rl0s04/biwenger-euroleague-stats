'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { ArrowUpDown } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ErrorBar,
  Scatter,
} from 'recharts';
import Link from 'next/link';

import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-50 text-xs">
        <p className="font-bold text-slate-200">{data.name}</p>
        <p className="text-green-400">Techo: {data.ceiling}</p>
        <p className="text-blue-400">Media: {data.avg}</p>
        <p className="text-red-400">Suelo: {data.floor}</p>
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

export default function FloorCeilingCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=floor-ceiling');

  // Transform for range chart
  const chartData = data.map((u) => ({
    name: u.name,
    user_id: u.user_id,
    range: [u.floor, u.ceiling],
    avg: u.avg,
    floor: u.floor,
    ceiling: u.ceiling,
  }));

  return (
    <Card
      title="Suelo y Techo"
      icon={ArrowUpDown}
      color="cyan"
      loading={loading}
      tooltip="Rango de puntuación (Mínimo - Máximo). La línea indica la media."
    >
      {!loading && chartData.length > 0 ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis type="number" domain={['auto', 'auto']} hide />
              <YAxis
                dataKey="name"
                type="category"
                width={90}
                tick={<CustomYAxisTick data={chartData} />}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

              {/* Range Bar (Floor to Ceiling) */}
              <Bar
                dataKey="range"
                barSize={12}
                fill="#334155"
                radius={[4, 4, 4, 4]}
                background={{ fill: 'transparent' }}
              />

              {/* Average Marker */}
              <Scatter dataKey="avg" fill="#22d3ee" shape="diamond" />

              {/* Min/Max dots? Optional */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">Sin datos suficientes</div>
      )}
    </Card>
  );
}
