'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
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
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
        <p className="text-slate-300 text-sm font-bold mb-2">{data.name}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <TrendingUp size={12} />
            <span>Por encima media: {data.above_avg_count} veces</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-400">
            <TrendingDown size={12} />
            <span>Por debajo media: {data.below_avg_count} veces</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 border-t border-slate-700 pt-2">
            Dif. promedio:{' '}
            <span className={data.avg_diff > 0 ? 'text-green-400' : 'text-red-400'}>
              {data.avg_diff > 0 ? '+' : ''}
              {data.avg_diff} pts
            </span>
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

export default function LeaguePerformanceCard() {
  const { data = [], loading } = useApiData('/api/standings/league-comparison');

  return (
    <Card title="Rendimiento vs Liga" icon={TrendingUp} color="cyan" loading={loading}>
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
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={<CustomYAxisTick data={data} />}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <ReferenceLine x={0} stroke="#475569" />
                <Bar dataKey="avg_diff" radius={[0, 4, 4, 0]} barSize={18}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avg_diff > 0 ? '#22d3ee' : '#f472b6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">No hay datos de rendimiento</div>
        ))}
    </Card>
  );
}
