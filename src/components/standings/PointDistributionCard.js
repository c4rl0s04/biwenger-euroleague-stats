'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getColorForUser } from '@/lib/constants/colors';
import Link from 'next/link';

// 1. Define the items exactly in the order you want them to appear
const LEGEND_ITEMS = [
  { label: '90-135', color: '#ef4444' }, // Red (First)
  { label: '136-170', color: '#eab308' }, // Yellow (Second)
  { label: '171-205', color: '#22d3ee' }, // Cyan (Third)
  { label: '206+', color: '#a855f7' }, // Purple (Last)
];

// 2. Custom Render Function for the Legend
const renderCustomLegend = () => {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-2 text-[10px]">
      {LEGEND_ITEMS.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <span className="text-slate-400 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-50 text-xs">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        <div className="space-y-1">
          {/* We rely on the payload order from the chart here, or we can sort it if needed */}
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
  const user = data.find((u) => u.name === payload.value);

  if (!user) {
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11}>
        {payload.value}
      </text>
    );
  }

  const userColor = getColorForUser(user.user_id, user.name, user.color_index);
  const name = user.name;

  let lines = [];
  let remaining = name;

  for (let i = 0; i < 3; i++) {
    if (!remaining) break;
    if (remaining.length <= 10) {
      lines.push(remaining);
      break;
    }
    if (i === 2) {
      lines.push(remaining.substring(0, 9) + '...');
      break;
    }
    const splitIndex = remaining.substring(0, 11).lastIndexOf(' ');
    if (splitIndex > 0) {
      lines.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex + 1);
    } else {
      lines.push(remaining.substring(0, 10));
      remaining = remaining.substring(10);
    }
  }

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

export default function PointDistributionCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=distribution');

  const chartData = data.map((u) => ({
    name: u.name,
    user_id: u.user_id,
    color_index: u.color_index,
    '90-135': u.distribution['90-135'] || 0,
    '136-170': u.distribution['136-170'] || 0,
    '171-205': u.distribution['171-205'] || 0,
    '206+': u.distribution['206+'] || 0,
  }));

  return (
    <Card
      title="Zona de Confort"
      icon={BarChart2}
      color="purple"
      loading={loading}
      tooltip="Distribución de puntuaciones (Media ~160pts)"
      className="h-full flex flex-col"
    >
      {!loading && chartData.length > 0 ? (
        <div className="w-full flex-1 min-h-[200px]">
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
                width={85}
                tick={<CustomYAxisTick data={chartData} />}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

              {/* 3. Use the content prop to Force the render of our custom legend */}
              <Legend content={renderCustomLegend} />

              <Bar
                dataKey="90-135"
                stackId="a"
                fill="#ef4444"
                radius={[4, 0, 0, 4]}
                name="90-135"
              />
              <Bar dataKey="136-170" stackId="a" fill="#eab308" name="136-170" />
              <Bar dataKey="171-205" stackId="a" fill="#22d3ee" name="171-205" />
              <Bar dataKey="206+" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} name="206+" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">Sin datos</div>
      )}
    </Card>
  );
}
