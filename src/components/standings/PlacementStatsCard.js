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

  for (let i = 0; i < 3; i++) {
    if (!remaining) break;
    if (remaining.length <= 10) {
      lines.push(remaining);
      remaining = null;
      break;
    }
    if (i === 2) {
      lines.push(remaining.length > 10 ? remaining.substring(0, 9) + '...' : remaining);
      remaining = null;
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

  const firstLineDy = lines.length === 1 ? 4 : lines.length === 2 ? -5 : -10;

  return (
    <g transform={`translate(${x},${y})`}>
      <Link href={`/user/${user.user_id}`}>
        <text
          x={0}
          y={0}
          dy={lines.length === 1 ? 4 : 0}
          textAnchor="end"
          fill={colors.stroke}
          fontSize={11}
          fontWeight={500}
          className="group transition-transform hover:scale-110 origin-right"
          style={{ transformBox: 'fill-box' }}
        >
          <title>{name}</title>
          {lines.map((line, index) => (
            <tspan
              key={index}
              x={0}
              dy={index === 0 ? (lines.length === 1 ? 0 : firstLineDy) : 10}
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

export default function PlacementStatsCard() {
  const { data = [], loading } = useApiData('/api/standings/placements');

  return (
    <Card
      title="Podios vs Descenso"
      icon={Trophy}
      color="amber"
      loading={loading}
      className="h-[600px] flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Spacer to match the description height of other cards if needed, or just padding */}
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-slate-400 italic px-2">
                Frecuencia de aparición en el{' '}
                <span className="text-amber-400 font-bold">Top 3</span> y{' '}
                <span className="text-red-400 font-bold">Bottom 3</span>.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
              <div style={{ height: `${Math.max(300, data.length * 65)}px`, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
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
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">No hay datos de posiciones</div>
        ))}
    </Card>
  );
}
