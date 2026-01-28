'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { TrendingUp } from 'lucide-react';

/**
 * Custom tooltip for the performance chart
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const actual = payload.find((p) => p.dataKey === 'actual_points')?.value || 0;
  const ideal = payload.find((p) => p.dataKey === 'ideal_points')?.value || 0;
  const efficiency = ideal > 0 ? ((actual / ideal) * 100).toFixed(1) : 100;

  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-2">Jornada {label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-sm text-white">
            Actual: <strong>{actual}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-white">
            Ideal: <strong>{ideal}</strong>
          </span>
        </div>
        <div className="pt-1 border-t border-white/10">
          <span
            className={`text-sm font-bold ${efficiency >= 80 ? 'text-emerald-400' : efficiency >= 60 ? 'text-yellow-400' : 'text-red-400'}`}
          >
            {efficiency}% eficiencia
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <ElegantCard title="Evolución de Puntos" icon={TrendingUp} color="orange">
        <div className="h-80 flex items-center justify-center text-zinc-500">
          Sin datos suficientes
        </div>
      </ElegantCard>
    );
  }

  return (
    <ElegantCard title="Evolución de Puntos" icon={TrendingUp} color="orange">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="round_number"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#3f3f46' }}
            />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span className="text-xs text-zinc-400">
                  {value === 'actual_points' ? 'Puntos Reales' : 'Puntos Ideales'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="ideal_points"
              stroke="#10b981"
              fill="url(#gradientIdeal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="actual_points"
              stroke="#f97316"
              fill="url(#gradientActual)"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ElegantCard>
  );
}
