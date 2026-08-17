'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeEuro,
  BarChart3,
  Check,
  ChevronDown,
  CircleGauge,
  Download,
  FlaskConical,
  Goal,
  Info,
  LoaderCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { runSeasonReviewScenario } from '@/app/(app)/season-review/actions';
import { POSITION_PRESETS } from '@/lib/season-review/engine';
import type {
  RecommendationProfile,
  ScenarioConfig,
  ScenarioResult,
  ScoreBreakdown,
  SeasonReviewOverview,
} from '@/lib/season-review/types';

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
const percent = (value: number) => `${number.format(value * 100)}%`;
const scoreLabels: Record<keyof ScoreBreakdown, string> = {
  equality: 'Igualdad',
  competitiveness: 'Competición',
  merit: 'Mérito',
  liquidity: 'Liquidez',
  practicality: 'Facilidad',
};
const profileStyles: Record<
  RecommendationProfile['id'],
  { color: string; border: string; icon: typeof Scale }
> = {
  equality: { color: 'text-sky-300', border: 'border-sky-400/25', icon: Scale },
  balanced: { color: 'text-orange-300', border: 'border-orange-400/25', icon: CircleGauge },
  merit: { color: 'text-emerald-300', border: 'border-emerald-400/25', icon: Trophy },
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function configSummary(config: ScenarioConfig) {
  const payout =
    config.payoutMode === 'inverse'
      ? 'Inversa'
      : config.payoutMode === 'direct'
        ? 'Directa'
        : config.payoutMode === 'equal'
          ? 'Igual'
          : `Híbrida ${Math.round(config.meritWeight * 100)}/${Math.round((1 - config.meritWeight) * 100)}`;
  return [
    `${config.rosterCap} jugadores`,
    `${payout} · ${compactMoney.format(config.eurosPerPoint)}/pto`,
    config.positionPreset === 'none' ? 'Sin posiciones' : config.positionPreset,
    config.idealPlayerBonus ? `${compactMoney.format(config.idealPlayerBonus)} ideal` : 'Sin ideal',
    config.mvpBonus ? `${compactMoney.format(config.mvpBonus)} MVP` : 'Sin MVP',
    `${config.marketSlots} en mercado`,
    config.squadValueCap
      ? `Tope ${compactMoney.format(config.squadValueCap)}`
      : 'Sin tope de valor',
    config.budgetMode === 'neutral' ? 'Presupuesto neutral' : 'Importes literales',
  ];
}

function Card({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={classNames(
        'relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-zinc-950/65 shadow-[0_24px_80px_-40px_rgba(0,0,0,.9)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </section>
  );
}

function Eyebrow({
  children,
  tone = 'orange',
}: {
  children: React.ReactNode;
  tone?: 'orange' | 'sky' | 'emerald';
}) {
  const tones = {
    orange: 'border-orange-400/20 bg-orange-400/10 text-orange-300',
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  };
  return (
    <span
      className={classNames(
        'inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]',
        tones[tone]
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
  const toneClasses = {
    orange: 'bg-orange-400/10 text-orange-300 border-orange-400/20',
    sky: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
    emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    zinc: 'bg-white/5 text-zinc-300 border-white/10',
  };
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
        <span
          className={classNames(
            'grid size-8 place-items-center rounded-lg border',
            toneClasses[tone]
          )}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function ScoreBars({ scores }: { scores: ScoreBreakdown }) {
  return (
    <div className="space-y-2.5">
      {(Object.keys(scoreLabels) as Array<keyof ScoreBreakdown>).map((key) => (
        <div key={key} className="grid grid-cols-[88px_1fr_34px] items-center gap-3 text-xs">
          <span className="text-zinc-500">{scoreLabels[key]}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-300"
              style={{ width: `${scores[key]}%` }}
            />
          </span>
          <span className="text-right font-black tabular-nums text-zinc-300">
            {Math.round(scores[key])}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecommendationCard({
  profile,
  onApply,
}: {
  profile: RecommendationProfile;
  onApply: (config: ScenarioConfig) => void;
}) {
  const style = profileStyles[profile.id];
  const Icon = style.icon;
  const weighted = (Object.keys(profile.weights) as Array<keyof ScoreBreakdown>).reduce(
    (sum, key) => sum + profile.winner.scores[key] * profile.weights[key],
    0
  );
  return (
    <Card className={classNames('flex h-full flex-col p-5 md:p-6', style.border)}>
      <div className="absolute -right-14 -top-16 size-40 rounded-full bg-white/[0.025] blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <span
            className={classNames(
              'grid size-10 place-items-center rounded-xl border border-current/20 bg-current/10',
              style.color
            )}
          >
            <Icon size={19} />
          </span>
          <h3 className="mt-4 text-xl font-black text-white">{profile.name}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{profile.description}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums text-white">{Math.round(weighted)}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
            puntuación
          </p>
        </div>
      </div>
      <div className="my-5 h-px bg-white/[0.06]" />
      <ScoreBars scores={profile.winner.scores} />
      <div className="mt-5 flex flex-wrap gap-1.5">
        {configSummary(profile.winner.config).map((item) => (
          <span
            key={item}
            className="rounded-md border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold text-zinc-400"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/25 p-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">Dinero</p>
          <p className="mt-1 text-sm font-black text-zinc-200">
            {compactMoney.format(profile.winner.totalPayout)}
          </p>
        </div>
        <div className="rounded-xl bg-black/25 p-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">Inflación</p>
          <p
            className={classNames(
              'mt-1 text-sm font-black',
              Math.abs(profile.winner.inflation) < 0.01 ? 'text-emerald-300' : 'text-amber-300'
            )}
          >
            {profile.winner.inflation >= 0 ? '+' : ''}
            {percent(profile.winner.inflation)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onApply(profile.winner.config)}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black text-white transition hover:border-orange-400/40 hover:bg-orange-400/10"
      >
        Probar configuración <ArrowRight size={14} />
      </button>
    </Card>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-black/35 px-3 pr-9 text-sm font-semibold text-zinc-200 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/10"
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-3.5 text-zinc-600"
          size={15}
        />
      </span>
      {hint && <span className="mt-1.5 block text-[10px] leading-4 text-zinc-600">{hint}</span>}
    </label>
  );
}

function ConfidenceBadge({ value }: { value: ScenarioResult['confidence'] }) {
  const data = {
    high: ['Alta', 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'],
    medium: ['Media', 'border-amber-400/20 bg-amber-400/10 text-amber-300'],
    low: ['Baja', 'border-red-400/20 bg-red-400/10 text-red-300'],
  }[value];
  return (
    <span
      className={classNames(
        'rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest',
        data[1]
      )}
    >
      Confianza {data[0]}
    </span>
  );
}

function SimulatorResult({ result, loading }: { result: ScenarioResult; loading: boolean }) {
  const chartData = result.users.map((user) => ({
    name: user.name.length > 14 ? `${user.name.slice(0, 13)}…` : user.name,
    actual: user.baselinePayout / 1000000,
    escenario: user.totalPayout / 1000000,
  }));
  const radarData = (Object.keys(scoreLabels) as Array<keyof ScoreBreakdown>).map((key) => ({
    metric: scoreLabels[key],
    score: Math.round(result.scores[key]),
  }));
  return (
    <div
      className={classNames('relative space-y-5 transition-opacity', loading && 'opacity-45')}
      aria-live="polite"
      aria-busy={loading}
    >
      {loading && (
        <LoaderCircle
          className="absolute right-1 top-1 z-10 animate-spin text-orange-400"
          size={20}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Resultado simulado
          </p>
          <p className="mt-1 text-2xl font-black text-white">
            {compactMoney.format(result.totalPayout)}
          </p>
        </div>
        <ConfidenceBadge value={result.confidence} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">Gini recursos</p>
          <p className="mt-1 text-lg font-black text-white">{number.format(result.gini)}</p>
          <p
            className={classNames(
              'mt-1 text-[10px] font-bold',
              result.gini <= result.baselineGini ? 'text-emerald-300' : 'text-red-300'
            )}
          >
            {result.gini <= result.baselineGini ? 'Mejora' : 'Empeora'} vs{' '}
            {number.format(result.baselineGini)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">Inflación</p>
          <p className="mt-1 text-lg font-black text-white">
            {result.inflation >= 0 ? '+' : ''}
            {percent(result.inflation)}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">frente al reparto real</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">Incumple plantilla</p>
          <p className="mt-1 text-lg font-black text-white">{percent(result.rosterBreachRate)}</p>
          <p className="mt-1 text-[10px] text-zinc-600">máx. +{result.rosterMaxExcess} jugadores</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600">Espera mercado</p>
          <p className="mt-1 text-lg font-black text-white">
            ~{result.expectedMarketWaitDays} días
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">estimación de rotación</p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.45fr_.8fr]">
        <div
          className="h-72 rounded-2xl border border-white/[0.06] bg-black/20 p-3"
          role="img"
          aria-label="Comparación de primas reales y simuladas por usuario"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 14, right: 8, left: -15, bottom: 24 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={9}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#71717a" fontSize={9} tickFormatter={(value) => `${value}M`} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,.03)' }}
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 12,
                }}
                formatter={(value) => [`${number.format(Number(value))} M€`]}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              <Bar dataKey="actual" name="Real" fill="#52525b" radius={[5, 5, 0, 0]} />
              <Bar dataKey="escenario" name="Escenario" fill="#fa5001" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          className="h-72 rounded-2xl border border-white/[0.06] bg-black/20 p-2"
          role="img"
          aria-label="Puntuación del escenario por objetivos"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="67%">
              <PolarGrid stroke="rgba(255,255,255,.09)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="#fb923c" fill="#fa5001" fillOpacity={0.28} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <details className="group rounded-2xl border border-white/[0.06] bg-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-black text-zinc-300">
          Tabla accesible por usuario{' '}
          <ChevronDown className="transition group-open:rotate-180" size={15} />
        </summary>
        <div className="overflow-x-auto border-t border-white/[0.06]">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-[9px] uppercase tracking-widest text-zinc-600">
              <tr>
                {[
                  'Usuario',
                  'Puntos',
                  'Base',
                  'Posición',
                  'Ideal/MVP',
                  'Porras est.',
                  'Total',
                  'Δ real',
                ].map((label) => (
                  <th key={label} className="px-4 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => (
                <tr key={user.userId} className="border-t border-white/[0.05] text-zinc-400">
                  <td className="px-4 py-3 font-bold text-white">{user.name}</td>
                  <td className="px-4 py-3 tabular-nums">{user.points}</td>
                  <td className="px-4 py-3 tabular-nums">{compactMoney.format(user.basePayout)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {compactMoney.format(user.positionPayout)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {compactMoney.format(user.idealPayout + user.mvpPayout)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {compactMoney.format(user.porraPayout)}
                  </td>
                  <td className="px-4 py-3 font-black tabular-nums text-white">
                    {compactMoney.format(user.totalPayout)}
                  </td>
                  <td
                    className={classNames(
                      'px-4 py-3 font-bold tabular-nums',
                      user.delta >= 0 ? 'text-emerald-300' : 'text-red-300'
                    )}
                  >
                    {user.delta >= 0 ? '+' : ''}
                    {compactMoney.format(user.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default function SeasonReviewClient({ overview }: { overview: SeasonReviewOverview }) {
  const [config, setConfig] = useState<ScenarioConfig>(overview.defaults);
  const [result, setResult] = useState<ScenarioResult>(overview.baseline);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const response = await runSeasonReviewScenario(config);
        if (response.success) {
          setResult(response.data);
          setError(null);
        } else setError(response.error);
      });
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [config]);

  const timelineData = useMemo(
    () =>
      overview.timeline.map((point, index) => ({
        jornada: index + 1,
        primas: point.cumulativePayout / 1000000,
        gini: point.payoutGini,
      })),
    [overview.timeline]
  );
  const baselineTop = overview.baseline.users[0];
  const baselineBottom = overview.baseline.users[overview.baseline.users.length - 1];

  function updateConfig<K extends keyof ScenarioConfig>(key: K, value: ScenarioConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function applyRecommendation(next: ScenarioConfig) {
    setConfig(next);
    window.setTimeout(
      () =>
        document
          .getElementById('laboratorio')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50
    );
  }

  function downloadCsv() {
    const rows = [
      [
        'Usuario',
        'Puntos',
        'Prima base',
        'Prima posición',
        'Ideal',
        'MVP',
        'Porras estimadas',
        'Total',
        'Diferencia real',
      ],
      ...result.users.map((user) => [
        user.name,
        user.points,
        user.basePayout,
        user.positionPayout,
        user.idealPayout,
        user.mvpPayout,
        user.porraPayout,
        user.totalPayout,
        user.delta,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisis-2025-26-${config.payoutMode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[42rem] overflow-hidden">
        <div className="absolute left-[8%] top-24 size-72 rounded-full bg-orange-500/[0.07] blur-[110px]" />
        <div className="absolute right-[5%] top-56 size-80 rounded-full bg-sky-500/[0.05] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.3)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <Card className="p-6 md:p-8">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Eyebrow>Temporada congelada</Eyebrow>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  Solo lectura
                </span>
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-0.03em] text-white md:text-5xl">
                La liga, convertida en una{' '}
                <span className="text-orange-400">decisión medible.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                Reproducimos el reparto real, aislamos el efecto de cada regla y mostramos tres
                formas honestas de entender qué significa una liga “justa”.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Jornadas"
                value={String(overview.quality.comparableRounds)}
                detail="comparables"
                icon={BarChart3}
                tone="orange"
              />
              <Metric
                label="Usuarios"
                value={String(overview.quality.users)}
                detail="managers activos"
                icon={Users}
                tone="sky"
              />
              <Metric
                label="Fichajes"
                value={number.format(overview.quality.transfers)}
                detail="operaciones únicas"
                icon={BadgeEuro}
                tone="emerald"
              />
              <Metric
                label="Primas"
                value={compactMoney.format(overview.baseline.baselinePayout)}
                detail="reparto deduplicado"
                icon={WalletCards}
                tone="zinc"
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Desigualdad base"
            value={number.format(overview.baseline.baselineGini)}
            detail="Gini de recursos estimados"
            icon={Scale}
            tone="sky"
          />
          <Metric
            label="Ratio extremo"
            value={`${number.format(overview.baseline.resourceRatio)}×`}
            detail={`${baselineTop?.name ?? '—'} frente a ${baselineBottom?.name ?? '—'}`}
            icon={ArrowUpRight}
            tone="orange"
          />
          <Metric
            label="Residual porras"
            value={compactMoney.format(
              overview.baseline.users.reduce((sum, user) => sum + user.porraPayout, 0)
            )}
            detail="estimación conservada"
            icon={Target}
            tone="emerald"
          />
          <Metric
            label="Datos duplicados"
            value={`${overview.quality.rawFinanceRows - overview.quality.uniqueFinanceEvents}`}
            detail="filas excluidas del cálculo"
            icon={ShieldCheck}
            tone="zinc"
          />
        </div>

        <Card id="diagnostico" className="p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow tone="sky">01 · Radiografía histórica</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                Cómo se acumuló el dinero
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                La curva combina las primas únicas de cada jornada. El Gini muestra cuándo empezó a
                separarse el reparto entre usuarios.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Actualizado {overview.generatedAt.slice(0, 10)}
            </span>
          </div>
          <div
            className="mt-7 h-80"
            role="img"
            aria-label="Evolución acumulada de primas y desigualdad por jornada"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
                <XAxis dataKey="jornada" stroke="#71717a" fontSize={10} />
                <YAxis
                  yAxisId="money"
                  stroke="#71717a"
                  fontSize={10}
                  tickFormatter={(value) => `${value}M`}
                />
                <YAxis
                  yAxisId="gini"
                  orientation="right"
                  domain={[0, 0.35]}
                  stroke="#71717a"
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 12,
                  }}
                  formatter={(value, name) => [
                    name === 'Gini acumulado'
                      ? number.format(Number(value))
                      : `${number.format(Number(value))} M€`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  yAxisId="money"
                  type="monotone"
                  dataKey="primas"
                  name="Primas acumuladas"
                  stroke="#fa5001"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  yAxisId="gini"
                  type="monotone"
                  dataKey="gini"
                  name="Gini acumulado"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <section id="recomendaciones">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>02 · Tres respuestas</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                No hay una única liga perfecta
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Cada tarjeta optimiza una intención diferente. La configuración ganadora se elige
                sobre una frontera de alternativas no dominadas.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {overview.recommendations.map((profile) => (
              <RecommendationCard
                key={profile.id}
                profile={profile}
                onApply={applyRecommendation}
              />
            ))}
          </div>
        </section>

        <Card id="laboratorio" className="scroll-mt-24">
          <div className="border-b border-white/[0.07] p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Eyebrow tone="emerald">03 · Laboratorio</Eyebrow>
                <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                  Diseña vuestras reglas
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Los cálculos se actualizan automáticamente. Ningún control escribe en Biwenger ni
                  en la base de datos.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfig(overview.defaults)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-zinc-300 transition hover:bg-white/5"
                >
                  Restaurar real
                </button>
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-400"
                >
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-[340px_1fr]">
            <aside className="border-b border-white/[0.07] bg-black/15 p-5 lg:border-b-0 lg:border-r md:p-6">
              <div className="space-y-5">
                <SelectField
                  label="Máximo de plantilla"
                  value={config.rosterCap}
                  onChange={(value) =>
                    updateConfig('rosterCap', Number(value) as ScenarioConfig['rosterCap'])
                  }
                  hint="El histórico llegó a 25; la mediana fue 18."
                >
                  {[18, 20, 22, 25].map((value) => (
                    <option key={value} value={value}>
                      {value} jugadores
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Prima por puntos"
                  value={config.payoutMode}
                  onChange={(value) =>
                    updateConfig('payoutMode', value as ScenarioConfig['payoutMode'])
                  }
                >
                  <option value="inverse">Inversa</option>
                  <option value="hybrid">Híbrida</option>
                  <option value="direct">Directa</option>
                  <option value="equal">Igual para todos</option>
                </SelectField>
                {config.payoutMode === 'hybrid' && (
                  <SelectField
                    label="Peso del mérito"
                    value={config.meritWeight}
                    onChange={(value) =>
                      updateConfig('meritWeight', Number(value) as ScenarioConfig['meritWeight'])
                    }
                  >
                    <option value={0.25}>25% propio / 75% inverso</option>
                    <option value={0.5}>50% / 50%</option>
                    <option value={0.75}>75% propio / 25% inverso</option>
                  </SelectField>
                )}
                <SelectField
                  label="Euros por punto"
                  value={config.eurosPerPoint}
                  onChange={(value) =>
                    updateConfig('eurosPerPoint', Number(value) as ScenarioConfig['eurosPerPoint'])
                  }
                >
                  {[5000, 7500, 10000].map((value) => (
                    <option key={value} value={value}>
                      {fullMoney.format(value)}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Prima por posición"
                  value={config.positionPreset}
                  onChange={(value) => {
                    const preset = value as ScenarioConfig['positionPreset'];
                    setConfig((current) => ({
                      ...current,
                      positionPreset: preset,
                      positionBonuses: POSITION_PRESETS[preset],
                    }));
                  }}
                >
                  <option value="none">Sin prima</option>
                  <option value="winner">Ganador · 500k</option>
                  <option value="podium-light">Podio moderado</option>
                  <option value="podium-strong">Podio fuerte</option>
                  <option value="bottom-support">Compensar últimos</option>
                  <option value="custom">Personalizada</option>
                </SelectField>
                {config.positionPreset === 'custom' && (
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Importe por puesto
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {config.positionBonuses.map((value, index) => (
                        <label key={index} className="text-[9px] text-zinc-600">
                          {index + 1}º
                          <input
                            type="number"
                            min={0}
                            step={50000}
                            value={value}
                            onChange={(event) => {
                              const next = [...config.positionBonuses];
                              next[index] = Math.max(0, Number(event.target.value));
                              updateConfig('positionBonuses', next);
                            }}
                            className="mt-1 h-9 w-full rounded-lg border border-white/[0.08] bg-black/35 px-2 text-xs text-white outline-none focus:border-orange-400/50"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Por ideal"
                    value={config.idealPlayerBonus}
                    onChange={(value) =>
                      updateConfig(
                        'idealPlayerBonus',
                        Number(value) as ScenarioConfig['idealPlayerBonus']
                      )
                    }
                  >
                    {[0, 50000, 100000].map((value) => (
                      <option key={value} value={value}>
                        {fullMoney.format(value)}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Por MVP"
                    value={config.mvpBonus}
                    onChange={(value) =>
                      updateConfig('mvpBonus', Number(value) as ScenarioConfig['mvpBonus'])
                    }
                  >
                    {[0, 60000, 150000].map((value) => (
                      <option key={value} value={value}>
                        {fullMoney.format(value)}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 p-3 text-xs font-semibold text-zinc-400">
                  MVP acumulable con ideal
                  <input
                    type="checkbox"
                    checked={config.stackMvpAndIdeal}
                    onChange={(event) => updateConfig('stackMvpAndIdeal', event.target.checked)}
                    className="size-4 accent-orange-500"
                  />
                </label>
                <SelectField
                  label="Jugadores en mercado"
                  value={config.marketSlots}
                  onChange={(value) =>
                    updateConfig('marketSlots', Number(value) as ScenarioConfig['marketSlots'])
                  }
                  hint="Los datos de este apartado empiezan en marzo."
                >
                  {[10, 15, 20, 25, 30].map((value) => (
                    <option key={value} value={value}>
                      {value} diarios
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Límite de valor"
                  value={config.squadValueCap ?? 'none'}
                  onChange={(value) =>
                    updateConfig(
                      'squadValueCap',
                      value === 'none' ? null : (Number(value) as ScenarioConfig['squadValueCap'])
                    )
                  }
                >
                  <option value="none">Sin límite</option>
                  {[70000000, 80000000, 90000000, 100000000, 110000000].map((value) => (
                    <option key={value} value={value}>
                      {compactMoney.format(value)}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Comparación monetaria"
                  value={config.budgetMode}
                  onChange={(value) =>
                    updateConfig('budgetMode', value as ScenarioConfig['budgetMode'])
                  }
                >
                  <option value="literal">Importes literales</option>
                  <option value="neutral">Mismo presupuesto total</option>
                </SelectField>
              </div>
            </aside>
            <div className="p-5 md:p-7">
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs font-semibold text-red-300">
                  <AlertTriangle size={15} /> {error}
                </div>
              )}
              <SimulatorResult result={result} loading={isPending} />
            </div>
          </div>
        </Card>

        <section id="limites">
          <div className="mb-5">
            <Eyebrow tone="sky">04 · Presión estructural</Eyebrow>
            <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
              Qué exigiría cada límite
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              Estos resultados describen incumplimientos históricos. No adivinan qué jugadores
              habría vendido cada manager.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Users className="text-orange-300" size={18} />
                <h3 className="font-black text-white">Máximo de plantilla</h3>
              </div>
              <div className="mt-5 space-y-3">
                {overview.diagnostics.rosterCaps.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[85px_1fr_52px] items-center gap-3 text-xs"
                  >
                    <span className="font-bold text-zinc-300">{item.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <span
                        className="block h-full rounded-full bg-orange-400"
                        style={{ width: `${(item.breachRate || 0) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-zinc-500">
                      {percent(item.breachRate || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <WalletCards className="text-sky-300" size={18} />
                <h3 className="font-black text-white">Tope de valor</h3>
              </div>
              <div className="mt-5 space-y-3">
                {overview.diagnostics.squadValueCaps.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[72px_1fr_52px] items-center gap-3 text-xs"
                  >
                    <span className="font-bold text-zinc-300">{item.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <span
                        className="block h-full rounded-full bg-sky-400"
                        style={{ width: `${(item.breachRate || 0) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-zinc-500">
                      {percent(item.breachRate || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Goal className="text-emerald-300" size={18} />
                <h3 className="font-black text-white">Oferta automática</h3>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {overview.diagnostics.marketSlots.map((item) => (
                  <div
                    key={item.label}
                    className={classNames(
                      'rounded-xl border p-3 text-center',
                      Number(item.value) === 20
                        ? 'border-emerald-400/30 bg-emerald-400/10'
                        : 'border-white/[0.06] bg-black/20'
                    )}
                  >
                    <p className="text-lg font-black text-white">{item.value}</p>
                    <p className="mt-1 text-[9px] text-zinc-500">~{item.expectedWaitDays} días</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-zinc-600">
                <Info className="mt-0.5 shrink-0" size={12} /> Confianza baja: solo hay{' '}
                {overview.quality.marketSnapshotDays} días de snapshots.
              </p>
            </Card>
          </div>
        </section>

        <Card id="pareto" className="p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>05 · Frontera de Pareto</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                Alternativas que merecen debate
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Ninguna de estas configuraciones puede mejorar una dimensión sin ceder en otra.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black text-zinc-500">
              {overview.pareto.length} escenarios
            </span>
          </div>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                <tr>
                  {[
                    'Configuración',
                    'Igualdad',
                    'Competición',
                    'Mérito',
                    'Liquidez',
                    'Facilidad',
                    'Dinero',
                    '',
                  ].map((label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.pareto.slice(0, 12).map((scenario, index) => (
                  <tr
                    key={`${scenario.config.payoutMode}-${index}`}
                    className="border-t border-white/[0.05] text-zinc-400"
                  >
                    <td className="max-w-xs px-4 py-3 font-semibold text-zinc-200">
                      {configSummary(scenario.config).slice(0, 3).join(' · ')}
                    </td>
                    {(
                      ['equality', 'competitiveness', 'merit', 'liquidity', 'practicality'] as const
                    ).map((key) => (
                      <td key={key} className="px-4 py-3 font-black tabular-nums text-white">
                        {Math.round(scenario.scores[key])}
                      </td>
                    ))}
                    <td className="px-4 py-3 tabular-nums">
                      {compactMoney.format(scenario.totalPayout)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => applyRecommendation(scenario.config)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 font-bold text-orange-300 transition hover:bg-orange-400/10"
                      >
                        Probar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card id="metodologia" className="p-5 md:p-7">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <Eyebrow tone="emerald">06 · Metodología</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white">
                Lo que sabemos.
                <br />
                <span className="text-zinc-600">Y lo que no.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-500">
                La honestidad del modelo importa más que una falsa precisión. Los pagos se
                reproducen sobre decisiones reales; los límites estructurales se muestran como
                rangos de presión.
              </p>
              <a
                href="https://biwenger.as.com/blog/guias/consejos-para-configurar-tu-liga-biwenger-y-hacerla-mas-competitiva/"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-xs font-black text-orange-300 hover:text-orange-200"
              >
                Referencia oficial de Biwenger <ArrowUpRight size={13} />
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {overview.quality.warnings.map((warning, index) => (
                <div
                  key={warning}
                  className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-white/[0.05] text-[10px] font-black text-zinc-500">
                    0{index + 1}
                  </span>
                  <p className="mt-3 text-xs leading-6 text-zinc-400">{warning}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7 grid gap-3 border-t border-white/[0.06] pt-6 sm:grid-cols-3">
            <div className="flex gap-3">
              <Check className="mt-0.5 shrink-0 text-emerald-400" size={16} />
              <p className="text-xs leading-5 text-zinc-500">
                <strong className="block text-zinc-200">1.000 remuestreos</strong>Intervalos del 90%
                para escenarios finales.
              </p>
            </div>
            <div className="flex gap-3">
              <FlaskConical className="mt-0.5 shrink-0 text-sky-400" size={16} />
              <p className="text-xs leading-5 text-zinc-500">
                <strong className="block text-zinc-200">Solo lectura</strong>Sin tablas nuevas ni
                cambios remotos.
              </p>
            </div>
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 shrink-0 text-orange-400" size={16} />
              <p className="text-xs leading-5 text-zinc-500">
                <strong className="block text-zinc-200">Decisión colectiva</strong>Tres objetivos,
                no una verdad impuesta.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
