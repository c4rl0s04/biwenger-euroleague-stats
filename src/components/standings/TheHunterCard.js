'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Crosshair } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-50 pointer-events-none ring-1 ring-white/5 min-w-[150px]">
        <p className="text-slate-500 text-[10px] mb-2 font-black tracking-[0.15em] uppercase font-display">
          {label}
        </p>
        <p className={`text-xs font-bold ${val > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {val > 0 ? `Recortados: +${val}` : `Perdidos: ${val}`} pts
        </p>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, data }) => {
  const user = data.find((u) => u.name === payload.value);
  if (!user) return null;

  const userColor = getColorForUser(user.user_id, user.name, user.color_index);
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

  // Calculate dy to vertical align nicely
  const firstLineDy = lines.length === 1 ? 4 : lines.length === 2 ? -4 : -8;
  const lineHeight = 10;

  return (
    <g transform={`translate(${x},${y})`}>
      <Link href={`/user/${user.user_id}`}>
        <text
          x={0}
          y={0}
          textAnchor="end"
          fill={userColor.stroke}
          fontSize={10}
          className="group transition-all hover:scale-110 origin-right transition-colors"
          style={{ transformBox: 'fill-box' }}
        >
          {lines.map((line, index) => (
            <tspan
              key={index}
              x={0}
              dy={index === 0 ? firstLineDy : lineHeight}
              className="cursor-pointer font-black uppercase font-display tracking-tight"
            >
              {line}
            </tspan>
          ))}
        </text>
      </Link>
    </g>
  );
};

export default function TheHunterCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=hunter');

  return (
    <Card
      title="El Cazador"
      icon={Crosshair}
      color="red"
      loading={loading}
      tooltip="Puntos recortados (o perdidos) respecto al líder en las últimas 5 jornadas."
      // Add a class to the Card to ensure it takes height if placed in a grid
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="space-y-4 flex flex-col h-full min-h-[300px]">
          <p className="text-xs text-slate-400 italic px-2 flex-shrink-0">
            Puntos recortados (<span className="text-green-400 font-bold not-italic">+</span>) o
            perdidos (<span className="text-red-400 font-bold not-italic">-</span>) respecto al
            líder en las últimas 5 jornadas.
          </p>

          {/* Changed: Replaced dynamic height with flex-1 to fill available card space */}
          <div className="w-full flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                // removed barCategoryGap to let Recharts handle tight spacing
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={75}
                  tick={<CustomYAxisTick data={data} />}
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <ReferenceLine x={0} stroke="currentColor" className="text-white/20" />
                {/* Changed: Used maxBarSize instead of barSize so bars scale down on small screens */}
                <Bar dataKey="gained" radius={[4, 4, 4, 4]} maxBarSize={20}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gained > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center text-slate-500 py-4">No hay datos de persecución</div>
        )
      )}
    </Card>
  );
}
