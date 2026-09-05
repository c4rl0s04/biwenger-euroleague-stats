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
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { ElegantCard } from '@/components/ui';

// Custom Tooltip moved outside render
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const displayLabel = new Date(label).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const priceClass = payload[0].payload.isPositive ? 'text-blue-400' : 'text-rose-400';

    return (
      <div className="glass-panel p-3 rounded-lg">
        <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase mb-1">
          {displayLabel}
        </p>
        <p className={`${priceClass} font-black text-base tracking-tight`}>
          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
            payload[0].payload.price
          )}
        </p>
      </div>
    );
  }
  return null;
}

export default function PlayerPriceHistoryCard({ priceHistory, playerPrice, className = '' }) {
  const [range, setRange] = useState('3M');

  if (!priceHistory || priceHistory.length === 0) return null;

  const getFilteredData = () => {
    // Clone history and append current price to bridge the gap to today
    const historyWithCurrent = [...priceHistory];

    // Add today's actual price if the last data point is older than yesterday
    const lastPoint = new Date(historyWithCurrent[historyWithCurrent.length - 1].date);
    const today = new Date();
    if (today.getTime() - lastPoint.getTime() > 86400000) {
      historyWithCurrent.push({
        date: today.toISOString(),
        price: playerPrice,
      });
    }

    // Find the latest date in the dataset (now likely today)
    const latestDateMs = Math.max(...historyWithCurrent.map((d) => new Date(d.date).getTime()));
    const end = new Date(latestDateMs);
    let start = new Date(end);

    if (range === '1M') start.setMonth(end.getMonth() - 1);
    else if (range === '3M') start.setMonth(end.getMonth() - 3);
    else if (range === '1Y') start.setFullYear(end.getFullYear() - 1);
    else return historyWithCurrent;

    return historyWithCurrent.filter((d) => new Date(d.date) >= start);
  };

  const rawData = getFilteredData();

  // Calculate trend metrics for the selected range
  const startPrice = rawData[0]?.price || 0;
  const endPrice = rawData[rawData.length - 1]?.price || 0;
  const delta = endPrice - startPrice;
  const isPositive = delta >= 0;

  const minPrice = Math.min(...rawData.map((d) => d.price));
  const maxPrice = Math.max(...rawData.map((d) => d.price));

  const data = rawData.map((d) => ({
    fullDate: d.date,
    price: d.price,
    value: d.price / 1000000,
    isPositive,
  }));

  // Dynamic Theme Colors
  const themeColor = isPositive ? 'blue' : 'rose';
  const strokeClass = isPositive
    ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]'
    : 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]';
  const gradientClass = isPositive ? 'text-blue-500' : 'text-rose-500';

  return (
    <ElegantCard
      title="Evolución de Mercado"
      icon={Activity}
      color={themeColor}
      className={className}
      actionRight={
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5 shadow-inner">
          {['1M', '3M', '1Y', 'ALL'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                range === r
                  ? isPositive
                    ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                    : 'bg-rose-500/20 text-rose-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col w-full mt-3">
        {/* Dynamic Metrics Header */}
        <div className="flex items-end justify-between mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">
              Cambio en {range}
            </span>
            <div
              className={`text-2xl md:text-3xl font-black tabular-nums tracking-tighter flex items-center gap-2 ${isPositive ? 'text-blue-400' : 'text-rose-400'}`}
            >
              {isPositive ? (
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
              )}
              {isPositive ? '+' : ''}
              {(delta / 1000000).toFixed(2)}M
              <span className="text-sm md:text-base font-bold opacity-70 tracking-tight">
                ({startPrice > 0 ? ((delta / startPrice) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">
              Rango Periodo
            </span>
            <div className="text-sm md:text-base font-black text-foreground/90 tabular-nums">
              {(minPrice / 1000000).toFixed(1)}M - {(maxPrice / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="currentColor"
                    className={gradientClass}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="currentColor"
                    className={gradientClass}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-white/5"
                vertical={false}
              />
              <XAxis
                dataKey="fullDate"
                stroke="currentColor"
                className="text-muted-foreground"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickFormatter={(val) => {
                  if (!val) return '';
                  return new Date(val).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  });
                }}
                tickMargin={10}
                minTickGap={30}
                hide={data.length < 10}
              />
              <YAxis
                stroke="currentColor"
                className="text-muted-foreground"
                tick={{ fontSize: 10, fill: 'currentColor' }}
                tickFormatter={(val) => `${val.toFixed(1)}M`}
                domain={['auto', 'auto']}
                width={45}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'currentColor',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  className: gradientClass,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                className={strokeClass}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
                animationDuration={1500}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  className: isPositive
                    ? 'fill-blue-400 stroke-black'
                    : 'fill-rose-400 stroke-black',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ElegantCard>
  );
}
