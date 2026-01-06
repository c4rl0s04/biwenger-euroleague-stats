'use client';

import { Trophy, ArrowDownCircle } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
        <p className="text-slate-300 text-sm font-bold mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <Trophy size={12} />
            <span>Top 3: {payload[0].value} veces</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-400">
            <ArrowDownCircle size={12} />
            <span>Bottom 3: {payload[1].value} veces</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, data }) => {
  if (!data || !data[payload.index]) return null;
  const user = data[payload.index];
  const colors = getColorForUser(user.user_id, user.name);
  const name = payload.value;

  let lines = [];
  let remaining = name;

  // Split logic for up to 3 lines, max 10 chars each
  for (let i = 0; i < 3; i++) {
    if (!remaining) break;

    // If it fits, just take it
    if (remaining.length <= 10) {
      lines.push(remaining);
      remaining = null;
      break;
    }

    // Last line case: truncate if too long
    if (i === 2) {
      if (remaining.length > 10) {
        lines.push(remaining.substring(0, 9) + '...');
      } else {
        lines.push(remaining);
      }
      remaining = null;
      break;
    }

    // Find split point
    const splitIndex = remaining.substring(0, 11).lastIndexOf(' ');
    if (splitIndex > 0) {
      lines.push(remaining.substring(0, splitIndex));
      remaining = remaining.substring(splitIndex + 1);
    } else {
      lines.push(remaining.substring(0, 10));
      remaining = remaining.substring(10);
    }
  }

  // Calculate dy for first line to center the block
  // 1 line: dy=4
  // 2 lines: start at -5, step 10 -> -5, 5 (centered at 0)
  // 3 lines: start at -10, step 10 -> -10, 0, 10 (centered at 0)
  const firstLineDy = lines.length === 1 ? 4 : lines.length === 2 ? -5 : -10;

  return (
    <g transform={`translate(${x},${y})`}>
      <Link href={`/user/${user.user_id}`}>
        <text
          x={0}
          y={0}
          dy={lines.length === 1 ? 4 : 0}
          textAnchor="end"
          fill="#cbd5e1"
          fontSize={11}
          fontWeight={500}
          className="group transition-colors"
          style={{ '--hover-color': colors.stroke }}
        >
          <title>{name}</title>
          {lines.map((line, index) => (
            <tspan
              key={index}
              x={0}
              dy={index === 0 ? (lines.length === 1 ? 0 : firstLineDy) : 10}
              className="group-hover:fill-[var(--hover-color)] transition-colors cursor-pointer"
            >
              {line}
            </tspan>
          ))}
        </text>
      </Link>
    </g>
  );
};

export default function PlacementStatsCard() {
  const { data = [], loading } = useApiData('/api/standings/placements');

  return (
    <Card title="Podios vs Descenso" icon={Trophy} color="amber" loading={loading}>
      {!loading &&
        (data.length > 0 ? (
          <div className="w-full" style={{ height: `${Math.max(100, data.length * 65 + 40)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 0, right: 30, left: -10, bottom: 0 }}
                layout="vertical"
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                  horizontal={false}
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<CustomYAxisTick data={data} />}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar
                  dataKey="top_3_count"
                  name="Top 3"
                  fill="#fbbf24"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  stackId="stack"
                />
                <Bar
                  dataKey="bottom_3_count"
                  name="Bottom 3"
                  fill="#f87171"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">No hay datos de posiciones</div>
        ))}
    </Card>
  );
}
