'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { useApiData } from '@/lib/hooks/useApiData';

const TIME_PERIODS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const dayData = payload[0].payload; // Access the full data object for this day
  const transfers = dayData.transfers || [];

  const formatPrice = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val;
  };

  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl z-50 min-w-45 max-w-70">
      <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-1">
        <p className="text-xs text-zinc-400">{label}</p>
        <span className="text-xs font-mono font-bold text-orange-400">
          {(dayData.volume / 1000000).toFixed(2)}M €
        </span>
      </div>

      {transfers.length > 0 ? (
        <div className="space-y-1.5">
          {transfers.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-zinc-300 truncate max-w-37.5">{t.player_name}</span>
              <span className="font-mono text-white whitespace-nowrap">
                {formatPrice(t.price)} €
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Sin fichajes</p>
      )}
    </div>
  );
}

export default function MarketTrendsChart() {
  const [period, setPeriod] = useState(TIME_PERIODS[1]); // Default 1M
  const { data = [], loading } = useApiData(() => `/api/market/trends?days=${period.days}`, {
    dependencies: [period.days],
    cacheKey: `market-trends-${period.days}`,
    transform: (result) => (Array.isArray(result) ? result : []),
  });

  const formattedData = useMemo(() => {
    if (!data || !data.length) return [];
    return data.map((t) => ({
      ...t,
      shortDate: new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    }));
  }, [data]);

  const totalVolume = useMemo(() => {
    if (!data || !data.length) return 0;
    return data.reduce((sum, d) => sum + d.volume, 0);
  }, [data]);

  const periodSelector = (
    <div className="flex items-center gap-1 rounded-lg bg-zinc-800/50 p-1">
      {TIME_PERIODS.map((p) => (
        <button
          key={p.label}
          onClick={() => setPeriod(p)}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
            period.label === p.label
              ? 'bg-orange-500 text-white'
              : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <ElegantCard
      title="Volumen de Mercado"
      icon={TrendingUp}
      color="orange"
      info="Gasto total en fichajes a lo largo del tiempo para el periodo seleccionado."
      actionRight={periodSelector}
      className="overflow-visible"
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <p className="text-sm text-zinc-500">
          Total en los últimos <span className="font-bold text-orange-400">{period.days}</span> días
        </p>
        <p className="text-2xl font-black text-orange-400">
          {(totalVolume / 1000000).toFixed(1)}M €
        </p>
      </div>

      <div className="h-70 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-zinc-500">Cargando...</div>
          </div>
        ) : formattedData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-zinc-500">No hay datos para este periodo.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#3f3f46"
                opacity={0.3}
              />
              <XAxis
                dataKey="shortDate"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#f97316', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ElegantCard>
  );
}
