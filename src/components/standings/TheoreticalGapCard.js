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

// Updated Tick to support multi-line names without truncation
const CustomYAxisTick = ({ x, y, payload, data }) => {
  const user = data.find((u) => u.name === payload.value);
  if (!user)
    return (
      <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11}>
        {payload.value}
      </text>
    );

  const userColor = getColorForUser(user.user_id, user.name, user.color_index);
  const name = user.name;

  // Split logic
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

export default function TheoreticalGapCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=theoretical-gap');

  return (
    <Card
      title="Gap Teórico (Eficiencia)"
      icon={Goal}
      color="emerald"
      loading={loading}
      tooltip="Distancia acumulada respecto a la 'Temporada Perfecta' (suma de los ganadores de cada jornada)."
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col h-full gap-4">
          {/* Explanation Text - Changed text-center to text-left */}
          <p className="text-xs text-slate-400 italic px-2 text-left">
            Eficiencia comparada con la{' '}
            <span className="text-yellow-400 font-bold not-italic">Temporada Perfecta</span> (suma
            de todos los MVPs). El porcentaje indica cuántos puntos has capturado del máximo teórico
            posible.
          </p>

          {/* Perfect Score Context */}
          <div className="text-center text-[10px] font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded py-1 mx-4">
            Puntuación Perfecta Posible:{' '}
            <span className="font-bold">{data[0].perfectTotal} pts</span>
          </div>

          <div className="w-full flex-1 min-h-[200px]">
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
                  width={85}
                  tick={<CustomYAxisTick data={data} />}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="pct" barSize={15} radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => {
                    // Fetch user color using the helper
                    const userColor = getColorForUser(entry.user_id, entry.name, entry.color_index);
                    return <Cell key={`cell-${index}`} fill={userColor.stroke} fillOpacity={0.8} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">No hay datos</div>
      )}
    </Card>
  );
}
