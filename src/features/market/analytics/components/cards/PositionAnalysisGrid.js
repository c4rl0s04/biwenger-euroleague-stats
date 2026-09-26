'use client';

import { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { User, Euro, BarChart3 } from 'lucide-react';

const EMPTY_DISTRIBUTION = [];

const COLORS = {
  Unknown: '#64748b',
  Base: '#3b82f6',
  B: '#3b82f6',
  Alero: '#10b981',
  A: '#10b981',
  Pivot: '#ef4444',
  P: '#ef4444',
  'Ala-Pivot': '#f97316',
  AP: '#f97316',
  Escolta: '#6366f1',
  E: '#6366f1',
};

function normalizePosition(position) {
  const normalized = String(position || 'Unknown').trim();
  const mapping = {
    B: 'Base',
    A: 'Alero',
    P: 'Pivot',
    AP: 'Ala-Pivot',
    E: 'Escolta',
  };

  return mapping[normalized] || normalized;
}

function CustomTooltip({ active, payload, mode, totalValue }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const share =
    totalValue > 0 ? ((mode === 'volume' ? data.total_volume : data.count) / totalValue) * 100 : 0;

  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-2 shadow-xl z-50 text-xs">
      <p className="border-b border-white/5 pb-1 mb-1 font-bold text-white">
        {data.displayPosition || data.position}
      </p>
      {mode === 'volume' ? (
        <>
          <p className="text-zinc-300">
            Volumen:{' '}
            <span className="text-white font-mono">
              {(data.total_volume / 1000000).toFixed(1)}M €
            </span>
          </p>
          <p className="text-zinc-300">
            Cuota: <span className="text-white font-mono">{share.toFixed(0)}%</span>
          </p>
        </>
      ) : (
        <>
          <p className="text-zinc-300">
            Fichajes: <span className="text-white font-mono">{data.count}</span>
          </p>
          <p className="text-zinc-300">
            Cuota: <span className="text-white font-mono">{share.toFixed(0)}%</span>
          </p>
        </>
      )}
    </div>
  );
}

export default function PositionAnalysisGrid({ positionStats }) {
  const [distributionMode, setDistributionMode] = useState('count');
  const distribution = positionStats?.distribution ?? EMPTY_DISTRIBUTION;
  const processedDist = useMemo(
    () =>
      distribution.map((d) => ({
        ...d,
        displayPosition: normalizePosition(d.position),
        color: COLORS[normalizePosition(d.position)] || COLORS[d.position] || COLORS.Unknown,
      })),
    [distribution]
  );

  const totals = useMemo(() => {
    const totalTransfers = processedDist.reduce((sum, item) => sum + item.count, 0);
    const totalVolume = processedDist.reduce((sum, item) => sum + item.total_volume, 0);
    return { totalTransfers, totalVolume };
  }, [processedDist]);

  const premiumPosition = useMemo(() => {
    if (processedDist.length === 0) return null;
    return [...processedDist].sort((a, b) => b.avg_price - a.avg_price)[0];
  }, [processedDist]);

  const valuePosition = useMemo(() => {
    if (processedDist.length === 0) return null;
    return [...processedDist].sort((a, b) => a.avg_price - b.avg_price)[0];
  }, [processedDist]);

  const countRanking = useMemo(
    () => [...processedDist].sort((a, b) => b.count - a.count),
    [processedDist]
  );

  const volumeRanking = useMemo(
    () => [...processedDist].sort((a, b) => b.total_volume - a.total_volume),
    [processedDist]
  );

  // Helper for currency
  const fmt = (val) => val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  const fmtMillions = (val) => `${(val / 1000000).toFixed(1)}M €`;
  const distributionMetricKey = distributionMode === 'volume' ? 'total_volume' : 'count';
  const distributionTotal =
    distributionMode === 'volume' ? totals.totalVolume : totals.totalTransfers;

  const distributionLeader = useMemo(() => {
    if (processedDist.length === 0) return null;

    return [...processedDist].sort(
      (a, b) => b[distributionMetricKey] - a[distributionMetricKey]
    )[0];
  }, [distributionMetricKey, processedDist]);

  const operationsLeader = countRanking[0] || null;
  const operationsRunnerUp = countRanking[1] || null;
  const volumeLeader = volumeRanking[0] || null;
  const volumeRunnerUp = volumeRanking[1] || null;

  const operationsGap = useMemo(() => {
    if (!operationsLeader || !operationsRunnerUp || totals.totalTransfers === 0) return null;

    return {
      count: operationsLeader.count - operationsRunnerUp.count,
      share: ((operationsLeader.count - operationsRunnerUp.count) / totals.totalTransfers) * 100,
    };
  }, [operationsLeader, operationsRunnerUp, totals.totalTransfers]);

  const volumeGap = useMemo(() => {
    if (!volumeLeader || !volumeRunnerUp || totals.totalVolume === 0) return null;

    return {
      amount: volumeLeader.total_volume - volumeRunnerUp.total_volume,
      share: ((volumeLeader.total_volume - volumeRunnerUp.total_volume) / totals.totalVolume) * 100,
    };
  }, [volumeLeader, volumeRunnerUp, totals.totalVolume]);

  const topTwoVolumeShare = useMemo(() => {
    if (volumeRanking.length === 0 || totals.totalVolume === 0) return 0;
    const topTwoVolume = volumeRanking
      .slice(0, 2)
      .reduce((sum, item) => sum + item.total_volume, 0);
    return (topTwoVolume / totals.totalVolume) * 100;
  }, [volumeRanking, totals.totalVolume]);

  const ticketSpread = useMemo(() => {
    if (!premiumPosition || !valuePosition) return null;
    return premiumPosition.avg_price - valuePosition.avg_price;
  }, [premiumPosition, valuePosition]);

  if (!positionStats || distribution.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      <div className="xl:col-span-4">
        <ElegantCard
          title="Precio Medio"
          icon={Euro}
          color="emerald"
          className="h-full min-h-75"
          info="Comparativa limpia del ticket medio por posición y su peso relativo dentro del mercado reciente."
        >
          <div className="flex h-full flex-col space-y-5">
            <div className="border-b border-white/6 pb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Prima entre posiciones
              </div>
              <div className="mt-2 text-[2rem] leading-none font-black text-emerald-400">
                {premiumPosition && valuePosition
                  ? fmt(premiumPosition.avg_price - valuePosition.avg_price)
                  : '0'}{' '}
                <span className="text-xl text-emerald-400">€</span>
              </div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                {premiumPosition && valuePosition
                  ? `${premiumPosition.displayPosition} paga ${fmt(premiumPosition.avg_price - valuePosition.avg_price)}€ mas de media que ${valuePosition.displayPosition}`
                  : 'Sin datos suficientes'}
              </div>
            </div>

            <div className="flex-1 space-y-0">
              {processedDist.map((pos, index) => {
                const transferShare =
                  totals.totalTransfers > 0 ? (pos.count / totals.totalTransfers) * 100 : 0;
                const volumeShare =
                  totals.totalVolume > 0 ? (pos.total_volume / totals.totalVolume) * 100 : 0;

                return (
                  <div
                    key={pos.position}
                    className={index === 0 ? 'py-3' : 'border-t border-white/6 py-3'}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: pos.color }}
                        />
                        <span className="truncate font-bold text-zinc-200">
                          {pos.displayPosition}
                        </span>
                      </div>
                      <span className="font-mono text-emerald-400">{fmt(pos.avg_price)} €</span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(transferShare, 8)}%`,
                          backgroundColor: pos.color,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {pos.count} fichajes · {transferShare.toFixed(0)}%
                      </span>
                      <span>{volumeShare.toFixed(0)}% del volumen</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ElegantCard>
      </div>

      <div className="xl:col-span-5">
        <ElegantCard
          title="Distribución por Posición"
          icon={User}
          color="blue"
          className="h-full min-h-75"
          info="Alterna entre cuota de operaciones y cuota de volumen economico para comparar el peso real de cada posicion."
          actionRight={
            <div className="inline-flex rounded-full border border-white/8 bg-zinc-950/70 p-1">
              <button
                type="button"
                onClick={() => setDistributionMode('count')}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                  distributionMode === 'count'
                    ? 'bg-blue-500 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Fichajes
              </button>
              <button
                type="button"
                onClick={() => setDistributionMode('volume')}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                  distributionMode === 'volume'
                    ? 'bg-blue-500 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Volumen
              </button>
            </div>
          }
        >
          <div className="flex h-full flex-col items-center justify-start gap-3 pt-1">
            <div className="relative h-76 w-full max-w-lg">
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Dominante</div>
                <div className="mt-1 max-w-44 text-3xl leading-none font-black text-white">
                  {distributionLeader?.displayPosition || 'Sin datos'}
                </div>
                <div className="mt-2 text-base font-semibold text-zinc-300">
                  {distributionLeader
                    ? `${Math.round((distributionLeader[distributionMetricKey] / distributionTotal) * 100)}% del ${distributionMode === 'volume' ? 'volumen' : 'mercado'}`
                    : 'Sin actividad'}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {distributionLeader
                    ? distributionMode === 'volume'
                      ? fmtMillions(distributionLeader.total_volume)
                      : `${distributionLeader.count} fichajes`
                    : 'Sin actividad'}
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedDist}
                    dataKey={distributionMetricKey}
                    nameKey="displayPosition"
                    cx="50%"
                    cy="50%"
                    outerRadius={118}
                    innerRadius={78}
                    paddingAngle={3}
                  >
                    {processedDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#09090b"
                        strokeWidth={4}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip mode={distributionMode} totalValue={distributionTotal} />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 border-t border-white/6 pt-3 text-center">
              {processedDist.map((item) => {
                const share =
                  distributionTotal > 0
                    ? (item[distributionMetricKey] / distributionTotal) * 100
                    : 0;
                return (
                  <div key={item.position} className="px-2 py-1">
                    <div
                      className="mx-auto h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="mt-2 text-[11px] font-semibold text-zinc-200">
                      {item.displayPosition}
                    </div>
                    <div className="mt-1 text-sm font-mono font-semibold text-zinc-300">
                      {share.toFixed(0)}%
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {distributionMode === 'volume'
                        ? fmtMillions(item.total_volume)
                        : `${item.count} ops`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ElegantCard>
      </div>

      <div className="xl:col-span-3">
        <ElegantCard
          title="Concentración"
          icon={BarChart3}
          color="amber"
          className="h-full min-h-75"
          info="Resume cuanta distancia abre la posicion lider frente a la siguiente tanto en actividad como en dinero movilizado."
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 pb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Ventaja en fichajes
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: operationsLeader?.color || COLORS.Unknown }}
                />
                <div className="text-lg font-black text-white">
                  {operationsLeader?.displayPosition || 'Sin datos'}
                </div>
              </div>
              <div className="mt-1 text-xs text-amber-300">
                {operationsGap && operationsRunnerUp
                  ? `+${operationsGap.count} ops frente a ${operationsRunnerUp.displayPosition} · ${operationsGap.share.toFixed(0)} pts`
                  : 'Sin actividad'}
              </div>
            </div>

            <div className="flex-1 border-t border-white/6 py-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Ventaja en volumen
              </div>
              <div className="mt-2 text-lg font-black text-white">
                {volumeLeader?.displayPosition || 'Sin datos'}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {volumeGap && volumeRunnerUp
                  ? `+${fmtMillions(volumeGap.amount)} frente a ${volumeRunnerUp.displayPosition} · ${volumeGap.share.toFixed(0)} pts`
                  : 'Sin actividad'}
              </div>
            </div>

            <div className="flex-1 border-t border-white/6 pt-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Concentración del volumen
              </div>
              <div className="mt-2 text-lg font-black text-white">
                {topTwoVolumeShare.toFixed(0)}%
              </div>
              <div className="mt-1 text-xs text-emerald-300">
                {volumeRanking.length >= 2
                  ? `${volumeRanking[0].displayPosition} y ${volumeRanking[1].displayPosition} concentran la mayor parte del dinero`
                  : 'Sin actividad'}
              </div>
            </div>

            <div className="flex-1 border-t border-white/6 pt-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Amplitud del ticket
              </div>
              <div className="mt-2 text-lg font-black text-white">
                {ticketSpread ? `${fmt(ticketSpread)} €` : 'Sin datos'}
              </div>
              <div className="mt-1 text-xs text-emerald-300">
                {premiumPosition && valuePosition
                  ? `${premiumPosition.displayPosition} frente a ${valuePosition.displayPosition}`
                  : 'Sin actividad'}
              </div>
            </div>
          </div>
        </ElegantCard>
      </div>
    </div>
  );
}
