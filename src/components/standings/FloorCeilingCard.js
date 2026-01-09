'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { ArrowUpDown } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, Scatter } from 'recharts';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPayload = payload.find((p) => p.payload.name);
    const data = dataPayload ? dataPayload.payload : null;

    if (!data) return null;

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

  // Fallback if user not found
  if (!user) {
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11}>
        {payload.value}
      </text>
    );
  }

  const userColor = getColorForUser(user.user_id, user.name, user.color_index);
  const name = user.name;

  // --- Splitting Logic (Max 10 chars per line) ---
  let lines = [];
  let remaining = name;

  for (let i = 0; i < 3; i++) {
    if (!remaining) break;

    // 1. If it fits, push it and finish
    if (remaining.length <= 10) {
      lines.push(remaining);
      remaining = null;
      break;
    }

    // 2. If it's the 3rd (last) line and still too long, truncate with '...'
    if (i === 2) {
      lines.push(remaining.substring(0, 9) + '...');
      remaining = null;
      break;
    }

    // 3. Find the best place to split (last space within first 11 chars)
    // We check index 10 and below for a space
    let splitIndex = -1;
    const searchStr = remaining.substring(0, 11); // look at first 11 chars
    splitIndex = searchStr.lastIndexOf(' ');

    if (splitIndex > 0) {
      // Split at the space
      lines.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex + 1);
    } else {
      // No space found, force split at 10
      lines.push(remaining.substring(0, 10));
      remaining = remaining.substring(10);
    }
  }

  // Calculate vertical alignment
  // If 1 line, dy=4 centers it. If multiple, we shift up.
  const lineHeight = 12;
  const firstLineDy = lines.length === 1 ? 4 : lines.length === 2 ? -2 : -8;

  return (
    <g transform={`translate(${x},${y})`}>
      <Link href={`/user/${user.user_id}`}>
        <text
          x={0}
          y={0}
          textAnchor="end"
          fill={userColor.stroke}
          fontSize={11}
          className="group transition-transform hover:scale-110 origin-right"
          style={{ transformBox: 'fill-box' }}
        >
          {lines.map((line, index) => (
            <tspan
              key={index}
              x={-10}
              dy={index === 0 ? firstLineDy : lineHeight}
              className="cursor-pointer font-bold"
            >
              {line}
            </tspan>
          ))}
        </text>
      </Link>
    </g>
  );
};

export default function FloorCeilingCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=floor-ceiling');

  // Transform for range chart
  const chartData = data.map((u) => ({
    name: u.name,
    user_id: u.user_id,
    color_index: u.color_index,
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
      className="h-full flex flex-col"
    >
      {!loading && chartData.length > 0 ? (
        <div className="space-y-4 flex flex-col h-full min-h-[200px]">
          <p className="text-xs text-slate-400 italic px-2 flex-shrink-0">
            Rango de puntuación entre{' '}
            <span className="text-red-400 font-bold not-italic">Suelo</span> (min) y{' '}
            <span className="text-green-400 font-bold not-italic">Techo</span> (max). El{' '}
            <span className="text-cyan-400 font-bold not-italic">rombo</span> marca la media.
          </p>
          <div className="w-full flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis type="number" domain={['auto', 'auto']} hide />
                {/* Increased width to 85 to accommodate the multi-line text safely */}
                <YAxis
                  dataKey="name"
                  type="category"
                  width={85}
                  tick={<CustomYAxisTick data={chartData} />}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                <Bar
                  dataKey="range"
                  barSize={12}
                  fill="#334155"
                  radius={[4, 4, 4, 4]}
                  background={{ fill: 'transparent' }}
                  minPointSize={2}
                />

                <Scatter dataKey="avg" fill="#22d3ee" shape="diamond" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">Sin datos suficientes</div>
      )}
    </Card>
  );
}
