'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronDown,
  Clock3,
  Download,
  FlaskConical,
  Gauge,
  Info,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
  LineChart as LineChartIcon,
  Medal,
  ListOrdered,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import {
  buildEvolutionChartModel,
  type EvolutionMetric,
} from '@/lib/season-review/evolution-chart';
import type { ResilienceConfig, SeasonReviewOverviewV2 } from '@/lib/season-review/types';
import type {
  SimulationAnalysisArtifact,
  SimulationRankingProfileId,
} from '@/lib/season-review/simulation-types';

const compactMoney = new Intl.NumberFormat('es-ES', {
  notation: 'compact',
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 1,
});
const fullMoney = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const giniNumber = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const percent = (value: number) => `${number.format(value * 100)}%`;

function getScoreColor(score: number) {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00Z`)
  );
}

function Eyebrow({
  children,
  tone = 'orange',
}: {
  children: React.ReactNode;
  tone?: 'orange' | 'sky';
}) {
  return (
    <span
      className={cx(
        'inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em]',
        tone === 'orange'
          ? 'border-orange-400/25 bg-orange-400/10 text-orange-300'
          : 'border-sky-400/25 bg-sky-400/10 text-sky-300'
      )}
    >
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'orange',
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Scale;
  tone?: 'orange' | 'sky' | 'emerald' | 'zinc';
}) {
  const tones = {
    orange: 'text-orange-400',
    sky: 'text-sky-400',
    emerald: 'text-emerald-400',
    zinc: 'text-zinc-400',
  };
  return (
    <ElegantCard title={label} icon={Icon} color={tone as any} padding="p-5">
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </ElegantCard>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/[0.09] bg-black/40 px-3 pr-9 text-sm font-bold text-zinc-200 outline-none transition-all duration-300 hover:border-orange-400/50 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/10"
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-3.5 text-zinc-600 transition-colors group-hover:text-orange-400"
          size={15}
        />
      </span>
    </label>
  );
}

function configSummary(config: ResilienceConfig) {
  return [
    `${config.rosterCap} jug.`,
    config.payoutDirection === 'inverse' ? 'Primas inv.' : 'Primas dir.',
    `${integer.format(config.eurosPerPoint)}€/pt`,
    `${config.marketSlots} merc.`,
  ];
}

const profileIcons: Record<SimulationRankingProfileId, any> = {
  equality: Scale,
  'competitive-balance': Users,
  resilience: ShieldCheck,
  merit: Trophy,
  balanced: Target,
};

export default function SeasonReviewClient({
  overview,
  simulationAnalysis,
}: {
  overview: SeasonReviewOverviewV2;
  simulationAnalysis: SimulationAnalysisArtifact;
}) {
  const [historyMetric, setHistoryMetric] = useState<EvolutionMetric>('squadValue');
  const [historyView, setHistoryView] = useState<'all' | 'comparison'>('all');
  const [comparisonUsers, setComparisonUsers] = useState<[string, string]>([
    overview.autopsy.leaderId,
    overview.autopsy.laggardId,
  ]);

  const initialConfigId = simulationAnalysis.ranking?.profiles[0]?.entries[0]?.configId ?? null;
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(initialConfigId);

  const allEvolutionUsers = useMemo(
    () => buildEvolutionChartModel(overview.timeline, historyMetric).series,
    [historyMetric, overview.timeline]
  );

  const historicalChart = useMemo(() => {
    const model = buildEvolutionChartModel(
      overview.timeline,
      historyMetric,
      historyView === 'comparison' ? comparisonUsers : undefined
    );
    return {
      series: model.series,
      data: model.data.map((point) => ({ ...point, label: shortDate(point.day) })),
    };
  }, [comparisonUsers, historyMetric, historyView, overview.timeline]);

  const selectedConfigData = useMemo(() => {
    if (!selectedConfigId || !simulationAnalysis.configurations) return null;
    return simulationAnalysis.configurations.find((c) => c.config.configId === selectedConfigId);
  }, [selectedConfigId, simulationAnalysis]);

  function downloadCsv() {
    const lines = [
      [
        'fecha',
        'usuario',
        'saldo_estimado',
        'valor_plantilla',
        'recursos_estimados',
        'puntos',
        'jugadores',
      ].join(','),
      ...overview.timeline.flatMap((point) =>
        point.users.map((user) =>
          [
            point.day,
            `"${user.name.replaceAll('"', '""')}"`,
            Math.round(user.cash),
            Math.round(user.squadValue),
            Math.round(user.totalResources),
            user.cumulativePoints,
            user.rosterSize,
          ].join(',')
        )
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analisis-resiliencia-2025-26.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[44rem] overflow-hidden">
        <div className="absolute left-[4%] top-24 size-80 rounded-full bg-orange-500/[0.075] blur-[120px]" />
        <div className="absolute right-[4%] top-40 size-96 rounded-full bg-sky-500/[0.055] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Intro Section */}
        <ElegantCard hideHeader className="p-6 md:p-9" bgColor="primary">
          <div className="absolute inset-y-0 right-0 hidden w-[44%] opacity-70 lg:block [background:radial-gradient(circle_at_center,rgba(250,80,1,.15),transparent_62%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
            <div>
              <Eyebrow>Nuevo modelo · punto cero</Eyebrow>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.98] tracking-[-0.04em] text-white md:text-6xl">
                Todos empezaron iguales. La brecha no.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                Reconstruimos saldo y plantilla desde 40 M€ por usuario para medir qué abrió la
                distancia, cuándo se volvió difícil de cerrar y qué reglas perdonan un error
                temprano.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-white transition-all hover:bg-white/[0.09] hover:scale-105"
                >
                  <Download size={14} /> Exportar evolución
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4 transition-colors hover:bg-black/40">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">
                  Patrimonio inicial
                </p>
                <p className="mt-3 text-3xl font-black text-white">40 M€</p>
                <p className="mt-1 text-xs text-zinc-500">exactos por usuario</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4 transition-colors hover:bg-black/40">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">
                  Plantilla inicial
                </p>
                <p className="mt-3 text-3xl font-black text-white">{overview.openingRosterSize}</p>
                <p className="mt-1 text-xs text-zinc-500">jugadores cada uno</p>
              </div>
            </div>
          </div>
        </ElegantCard>

        {/* Metrics Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Brecha a mitad"
            value={compactMoney.format(overview.autopsy.midpoint.resourceGap)}
            detail="recursos estimados entre líder y último"
            icon={TrendingUp}
          />
          <Metric
            label="Plantilla final"
            value={compactMoney.format(overview.autopsy.closing.squadGap)}
            detail="la diferencia competitiva oculta"
            icon={Users}
            tone="sky"
          />
          <Metric
            label="Pujas observadas"
            value={integer.format(overview.quality.bids)}
            detail={`asociadas a ${overview.quality.transfersWithBids} fichajes`}
            icon={Target}
            tone="emerald"
          />
        </div>

        {/* Real Evolution Chart */}
        <ElegantCard
          id="evolucion"
          title="Evolución Real"
          icon={LineChartIcon}
          color="sky"
          padding="p-5 md:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white md:text-3xl">
                De igualdad contable a desigualdad competitiva
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Compara saldo, valor de plantilla o recursos. El efectivo no da puntos: por eso la
                brecha de plantilla puede crecer aunque los recursos totales vuelvan a acercarse.
              </p>
            </div>
            <div className="flex rounded-xl border border-white/[0.08] bg-black/30 p-1">
              {(
                [
                  ['squadValue', 'Plantilla'],
                  ['totalResources', 'Recursos'],
                  ['cash', 'Saldo'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHistoryMetric(value)}
                  className={cx(
                    'cursor-pointer rounded-lg px-3 py-2 text-[10px] font-black transition-all duration-300',
                    historyMetric === value
                      ? 'bg-white/10 text-white scale-105'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/25 p-4 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Usuarios visibles
              </span>
              <div className="flex rounded-xl border border-white/[0.08] bg-zinc-950 p-1">
                <button
                  type="button"
                  onClick={() => setHistoryView('all')}
                  className={cx(
                    'cursor-pointer rounded-lg px-4 py-2 text-[10px] font-black transition-all duration-300',
                    historyView === 'all'
                      ? 'bg-orange-500 text-black scale-105'
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  Todos ({allEvolutionUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryView('comparison')}
                  className={cx(
                    'cursor-pointer rounded-lg px-4 py-2 text-[10px] font-black transition-all duration-300',
                    historyView === 'comparison'
                      ? 'bg-sky-400 text-black scale-105'
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  Comparar dos
                </button>
              </div>
            </div>

            {historyView === 'comparison' ? (
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                <SelectField
                  label="Primer usuario"
                  value={comparisonUsers[0]}
                  onChange={(userId) => setComparisonUsers([userId, comparisonUsers[1]])}
                >
                  {allEvolutionUsers.map((user) => (
                    <option
                      key={user.userId}
                      value={user.userId}
                      disabled={user.userId === comparisonUsers[1]}
                    >
                      {user.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Segundo usuario"
                  value={comparisonUsers[1]}
                  onChange={(userId) => setComparisonUsers([comparisonUsers[0], userId])}
                >
                  {allEvolutionUsers.map((user) => (
                    <option
                      key={user.userId}
                      value={user.userId}
                      disabled={user.userId === comparisonUsers[0]}
                    >
                      {user.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            ) : (
              <p className="text-xs leading-5 text-zinc-500 lg:ml-auto lg:max-w-sm lg:text-right">
                Se muestran las {allEvolutionUsers.length} trayectorias. Usa “Comparar dos” para
                aislar cualquier duelo.
              </p>
            )}
          </div>

          <div className="mt-7 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historicalChart.data}
                margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={9} interval="preserveStartEnd" />
                <YAxis stroke="#71717a" fontSize={9} tickFormatter={(value) => `${value}M`} />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  contentStyle={{
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 12,
                  }}
                  formatter={(value) => [`${number.format(Number(value))} M€`]}
                  labelFormatter={(_, rows) => rows?.[0]?.payload?.day || ''}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {historyMetric === 'totalResources' && (
                  <ReferenceLine
                    y={40}
                    stroke="rgba(255,255,255,.16)"
                    strokeDasharray="4 5"
                    label={{ value: 'Inicio 40 M€', fill: '#71717a', fontSize: 9 }}
                  />
                )}
                {historicalChart.series.map((user) => (
                  <Line
                    key={user.userId}
                    type="monotone"
                    dataKey={user.key}
                    name={user.name}
                    stroke={user.color}
                    strokeWidth={historyView === 'comparison' ? 3 : 2}
                    strokeOpacity={historyView === 'comparison' ? 1 : 0.82}
                    dot={false}
                    activeDot={{ r: 6, fill: user.color, stroke: '#000', strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ElegantCard>

        {/* Top Configurations by Category */}
        {simulationAnalysis?.ranking && (
          <section className="space-y-6">
            <div>
              <Eyebrow tone="orange">Preselección V4</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                Mejores Configuraciones
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Selecciona una configuración para ver sus métricas en detalle. Los resultados son
                fruto de miles de simulaciones Monte Carlo.
              </p>
            </div>

            <div className="space-y-8">
              {simulationAnalysis.ranking.profiles.map((profile) => {
                const Icon = profileIcons[profile.profileId] || Medal;
                return (
                  <ElegantCard
                    key={profile.profileId}
                    title={profile.label}
                    icon={Icon}
                    color="primary"
                    padding="p-5 overflow-hidden"
                  >
                    <div className="-mx-5 -mb-5 overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-sm text-zinc-300">
                        <thead className="border-b border-white/[0.05] bg-black/40 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
                          <tr>
                            <th className="px-5 py-4 w-12 text-center">#</th>
                            <th className="px-4 py-4">Configuración</th>
                            <th className="px-4 py-4 text-center">Nota Global</th>
                            <th className="px-4 py-4 text-center">Igualdad</th>
                            <th className="px-4 py-4 text-center">Competit.</th>
                            <th className="px-4 py-4 text-center">Resiliencia</th>
                            <th className="px-4 py-4 text-center">Mérito</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {profile.entries.slice(0, 5).map((entry, idx) => {
                            const isSelected = selectedConfigId === entry.configId;
                            return (
                              <tr
                                key={entry.configId}
                                onClick={() => setSelectedConfigId(entry.configId)}
                                className={cx(
                                  'cursor-pointer transition-colors hover:bg-white/[0.02]',
                                  isSelected ? 'bg-orange-500/10' : ''
                                )}
                              >
                                <td className="px-5 py-4 text-center font-black">{idx + 1}</td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {configSummary(entry.config).map((item) => (
                                      <span
                                        key={item}
                                        className="whitespace-nowrap rounded border border-white/[0.07] bg-white/[0.035] px-1.5 py-0.5 text-[9px] font-bold text-zinc-400"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                    {entry.isParetoOptimal && (
                                      <span className="whitespace-nowrap rounded bg-sky-400/20 px-1.5 py-0.5 text-[9px] font-black text-sky-300 ml-1">
                                        PARETO
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center font-black text-white">
                                  {number.format(entry.score)}
                                </td>
                                <td
                                  className={cx(
                                    'px-4 py-4 text-center font-black',
                                    getScoreColor(entry.dimensions.equality)
                                  )}
                                >
                                  {number.format(entry.dimensions.equality)}
                                </td>
                                <td
                                  className={cx(
                                    'px-4 py-4 text-center font-black',
                                    getScoreColor(entry.dimensions.competitiveness)
                                  )}
                                >
                                  {number.format(entry.dimensions.competitiveness)}
                                </td>
                                <td
                                  className={cx(
                                    'px-4 py-4 text-center font-black',
                                    getScoreColor(entry.dimensions.resilience)
                                  )}
                                >
                                  {number.format(entry.dimensions.resilience)}
                                </td>
                                <td
                                  className={cx(
                                    'px-4 py-4 text-center font-black',
                                    getScoreColor(entry.dimensions.merit)
                                  )}
                                >
                                  {number.format(entry.dimensions.merit)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </ElegantCard>
                );
              })}
            </div>
          </section>
        )}

        {/* Detailed Stats (Replaces Lab) */}
        {selectedConfigData && (
          <ElegantCard
            id="detailed-stats"
            title="Análisis Detallado de la Configuración"
            icon={Zap}
            color="emerald"
            padding="p-6 md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h3 className="text-2xl font-black text-white">Métricas y Distribuciones</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {configSummary(selectedConfigData.config).map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-bold text-zinc-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Muestra
                </p>
                <p className="text-xl font-black text-emerald-400">
                  {integer.format(selectedConfigData.sampleSize)} sim.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                  Gini Económico (Mediana)
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {giniNumber.format(selectedConfigData.metrics.finalResourceGini.median)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                  Recuperación (Absoluta)
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {percent(selectedConfigData.probabilities.absoluteRecovery.value)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                  Tiempo de Recuperación
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {integer.format(selectedConfigData.metrics.recoveryRounds.median)} jor.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                  Riesgo de Bloqueo
                </p>
                <p className="mt-2 text-2xl font-black text-red-400">
                  {percent(selectedConfigData.probabilities.lockIn.value)}
                </p>
              </div>
            </div>

            {/* Narrative section */}
            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-sky-950/20 p-5 md:p-6">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-sky-400">
                Interpretación Práctica
              </h4>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                En base a las{' '}
                <strong>
                  {integer.format(selectedConfigData.sampleSize)} temporadas simuladas
                </strong>{' '}
                bajo estas reglas, observamos que si un mánager sufre una crisis o comete un error
                grave, tiene un{' '}
                <strong>
                  {percent(selectedConfigData.probabilities.absoluteRecovery.value)} de probabilidad
                  de recuperarse
                </strong>{' '}
                y volver a ser competitivo. El riesgo de que la liga se bloquee irremediablemente
                (quedando el último clasificado sin opciones matemáticas o económicas) es de solo el{' '}
                <strong>{percent(selectedConfigData.probabilities.lockIn.value)}</strong>.
              </p>

              {selectedConfigData.probabilities.targetWinsTitle.value > 0.05 && (
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  Destaca además que, incluso sufriendo el mayor de los contratiempos iniciales, en
                  un{' '}
                  <strong>
                    {percent(selectedConfigData.probabilities.targetWinsTitle.value)} de los casos
                    ese mánager logró sobreponerse y ganar la liga
                  </strong>
                  , demostrando que esta configuración premia enormemente el mérito y la buena
                  gestión a largo plazo.
                </p>
              )}
            </div>

            {/* Scenarios Breakdown */}
            {selectedConfigData.scenarios &&
              Object.keys(selectedConfigData.scenarios).length > 0 && (
                <div className="mt-8">
                  <h4 className="mb-4 text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Tasa de fracaso (bloqueo) según el tipo de crisis
                  </h4>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Object.entries(selectedConfigData.scenarios).map(
                      ([kind, scenario]: [string, any]) => {
                        const shockLabels: Record<string, string> = {
                          'bad-transfer': 'Fichaje ruinoso',
                          'bad-streak': 'Mala racha',
                          'star-injury': 'Lesión de estrella',
                          inactivity: 'Inactividad temporal',
                        };
                        const label = shockLabels[kind] || kind;
                        const nonRecovery = 1 - scenario.absoluteRecovery.value;
                        const severityColor =
                          nonRecovery > 0.4
                            ? 'text-red-400'
                            : nonRecovery > 0.2
                              ? 'text-orange-400'
                              : 'text-emerald-400';

                        return (
                          <div
                            key={kind}
                            className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center transition-colors hover:bg-white/[0.04]"
                          >
                            <p className="text-[10px] font-bold text-zinc-400">{label}</p>
                            <p className={`mt-2 text-2xl font-black ${severityColor}`}>
                              {percent(nonRecovery)}
                            </p>
                            <p className="mt-1 text-[9px] text-zinc-600 uppercase tracking-widest">
                              imposible recuperar
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                  Distribución: Gini de Recursos Final
                </p>
                <div className="h-64 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedConfigData.metrics.finalResourceGini.histogram}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                      <XAxis
                        dataKey="start"
                        tickFormatter={(v) => giniNumber.format(v)}
                        stroke="#71717a"
                        fontSize={9}
                      />
                      <YAxis stroke="#71717a" fontSize={9} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{
                          background: '#09090b',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 12,
                        }}
                        formatter={(value) => [integer.format(Number(value)), 'Simulaciones']}
                      />
                      <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                  Distribución: Jornadas de Recuperación
                </p>
                <div className="h-64 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedConfigData.metrics.recoveryRounds.histogram}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                      <XAxis dataKey="start" stroke="#71717a" fontSize={9} />
                      <YAxis stroke="#71717a" fontSize={9} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{
                          background: '#09090b',
                          border: '1px solid rgba(255,255,255,.1)',
                          borderRadius: 12,
                        }}
                        formatter={(value) => [integer.format(Number(value)), 'Simulaciones']}
                      />
                      <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </ElegantCard>
        )}
      </div>
    </div>
  );
}
