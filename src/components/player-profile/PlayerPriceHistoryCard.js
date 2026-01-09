'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';

// Custom Tooltip moved outside render
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700 p-2 rounded shadow-xl backdrop-blur-md">
        <p className="text-slate-300 text-xs mb-1">{label}</p>
        <p className="text-emerald-400 font-bold text-sm">
          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
            payload[0].value * 1000000
          )}
        </p>
      </div>
    );
  }
  return null;
}

export default function PlayerPriceHistoryCard({ priceHistory, className = '' }) {
  const [range, setRange] = useState('3M');

  if (!priceHistory || priceHistory.length === 0) return null;

  const getFilteredData = () => {
    const end = new Date();
    let start = new Date();

    if (range === '1M') start.setMonth(end.getMonth() - 1);
    else if (range === '3M') start.setMonth(end.getMonth() - 3);
    else if (range === '1Y') start.setFullYear(end.getFullYear() - 1);
    else return priceHistory;

    return priceHistory.filter((d) => new Date(d.date) >= start);
  };

  const data = getFilteredData().map((d) => ({
    date: new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    price: d.price,
    value: d.price / 1000000,
  }));

  return (
    <Card
      title="Evolución de Mercado"
      icon={TrendingUp}
      color="cyan"
      className={className}
      actionRight={
        <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-slate-700/50">
          {['1M', '3M', '1Y', 'ALL'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                range === r
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[200px] w-full mt-2 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickMargin={10}
              hide={data.length < 10}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => `${val.toFixed(1)}M`}
              unit="M"
              domain={['auto', 'auto']}
              width={30}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
