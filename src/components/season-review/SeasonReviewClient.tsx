'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeEuro,
  BarChart3,
  ChevronDown,
  CircleGauge,
  Clock3,
  Download,
  FlaskConical,
  Gauge,
  Info,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { runSeasonReviewScenario } from '@/app/(app)/season-review/actions';
import {
  buildEvolutionChartModel,
  buildEvolutionMilestones,
  type EvolutionMetric,
  type EvolutionMilestone,
} from '@/lib/season-review/evolution-chart';
import type {
  GapContribution,
  ResilienceConfig,
  ResilienceRecommendation,
  ResilienceScores,
  SeasonRecoveryAnalysis,
  SeasonReviewOverviewV2,
  ShockConfig,
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
const integer = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const giniNumber = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const percent = (value: number) => `${number.format(value * 100)}%`;

const shockLabels: Record<ShockConfig['kind'], string> = {
  'bad-transfer': 'Mal fichaje',
  'bad-streak': 'Racha de malas jornadas',
  'star-injury': 'Lesión del jugador estrella',
  inactivity: 'Periodo de inactividad',
};
const severityLabels: Record<ShockConfig['severity'], string> = {
  low: 'Leve',
  medium: 'Medio',
  high: 'Grave',
};
const scoreLabels: Record<keyof Omit<ResilienceScores, 'overall'>, string> = {
  resilience: 'Recuperación',
  equality: 'Igualdad',
  merit: 'Mérito',
  liquidity: 'Liquidez',
  practicality: 'Facilidad',
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00Z`)
  );
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
      className={cx(
        'relative overflow-hidden rounded-[1.65rem] border border-white/[0.08] bg-zinc-950/70 shadow-[0_28px_90px_-55px_rgba(0,0,0,.95)] backdrop-blur-xl',
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
    orange: 'border-orange-400/20 bg-orange-400/10 text-orange-300',
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    zinc: 'border-white/10 bg-white/5 text-zinc-300',
  };
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
        <span className={cx('grid size-8 place-items-center rounded-lg border', tones[tone])}>
          <Icon size={15} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
    </div>
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
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-white/[0.09] bg-black/40 px-3 pr-9 text-sm font-bold text-zinc-200 outline-none transition focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/10"
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-3.5 text-zinc-600"
          size={15}
        />
      </span>
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
        {label}
        <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-white">
          {value} {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-orange-500"
      />
      <span className="mt-1.5 flex justify-between text-[9px] font-bold text-zinc-700">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );
}

const milestoneLabels: Record<EvolutionMilestone['id'], string> = {
  opening: 'Punto de partida',
  midpoint: 'Mitad de temporada',
  closing: 'Cierre',
};

function MilestoneTable({ milestones }: { milestones: EvolutionMilestone[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <caption className="sr-only">
            Plantilla, saldo, recursos totales y puntos de los usuarios visibles en cada hito
          </caption>
          <thead className="bg-zinc-950/80">
            <tr className="border-b border-white/[0.08] text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
              <th scope="col" className="px-5 py-3.5">
                Usuario
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Plantilla
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Saldo
              </th>
              <th scope="col" className="bg-sky-400/[0.045] px-4 py-3.5 text-right text-sky-300">
                Recursos totales
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Puntos
              </th>
            </tr>
          </thead>
          {milestones.map((milestone, milestoneIndex) => (
            <tbody key={milestone.id} className="border-b border-white/[0.08] last:border-0">
              <tr>
                <th scope="rowgroup" colSpan={5} className="p-0">
                  <span className="flex items-center gap-3 border-y border-white/[0.04] bg-white/[0.025] px-5 py-3 first:border-t-0">
                    <span className="grid size-7 place-items-center rounded-lg border border-orange-400/20 bg-orange-400/10 text-[9px] font-black text-orange-300">
                      {String(milestoneIndex + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <span className="block text-xs font-black text-white">
                        {milestoneLabels[milestone.id]}
                      </span>
                      <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                        {shortDate(milestone.day)} · {milestone.users.length}{' '}
                        {milestone.users.length === 1 ? 'usuario' : 'usuarios'}
                      </span>
                    </span>
                  </span>
                </th>
              </tr>
              {milestone.users.map((user) => (
                <tr
                  key={`${milestone.id}-${user.userId}`}
                  className="border-t border-white/[0.045] text-xs text-zinc-300 transition-colors hover:bg-white/[0.025]"
                >
                  <th scope="row" className="px-5 py-3.5 font-black text-zinc-200">
                    <span
                      className="mr-2.5 inline-block size-2 rounded-full ring-2 ring-white/[0.06]"
                      style={{ backgroundColor: user.color }}
                      aria-hidden="true"
                    />
                    {user.name}
                  </th>
                  <td className="px-4 py-3.5 text-right tabular-nums text-zinc-400">
                    {compactMoney.format(user.squadValue)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-zinc-400">
                    {compactMoney.format(user.cash)}
                  </td>
                  <td className="bg-sky-400/[0.035] px-4 py-3.5 text-right font-black tabular-nums text-sky-200">
                    {compactMoney.format(user.totalResources)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold tabular-nums text-zinc-500">
                    {integer.format(user.cumulativePoints)}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

function ContributionList({ rows }: { rows: GapContribution[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const positive = row.gapContribution > 0;
        return (
          <div key={row.id} className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-black text-zinc-200">{row.label}</p>
              <p
                className={cx(
                  'text-sm font-black tabular-nums',
                  positive ? 'text-orange-300' : 'text-sky-300'
                )}
              >
                {row.gapContribution > 0 ? '+' : ''}
                {compactMoney.format(row.gapContribution)}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={cx('h-full rounded-full', positive ? 'bg-orange-400' : 'bg-sky-400')}
                style={{ width: `${Math.min(100, Math.abs(row.gapContribution) / 650_000)}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-4 text-zinc-600">{row.interpretation}</p>
          </div>
        );
      })}
    </div>
  );
}

function ScoreBars({ scores }: { scores: ResilienceScores }) {
  return (
    <div className="space-y-2.5">
      {(Object.keys(scoreLabels) as Array<keyof typeof scoreLabels>).map((key) => (
        <div key={key} className="grid grid-cols-[88px_1fr_34px] items-center gap-3 text-xs">
          <span className="text-zinc-500">{scoreLabels[key]}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-300"
              style={{ width: `${Math.min(100, scores[key])}%` }}
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

function configSummary(config: ResilienceConfig) {
  return [
    `${config.rosterCap} jugadores`,
    config.payoutDirection === 'inverse' ? 'Prima inversa' : 'Prima directa',
    `${fullMoney.format(config.eurosPerPoint)}/punto`,
    `${config.marketSlots} en mercado`,
  ];
}

function RecommendationCard({
  recommendation,
  onApply,
}: {
  recommendation: ResilienceRecommendation;
  onApply: (config: ResilienceConfig) => void;
}) {
  const icons = { resilience: ShieldCheck, balanced: CircleGauge, merit: Trophy };
  const Icon = icons[recommendation.id];
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="absolute -right-10 -top-12 size-36 rounded-full bg-orange-400/[0.05] blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <span className="grid size-10 place-items-center rounded-xl border border-orange-400/20 bg-orange-400/10 text-orange-300">
          <Icon size={19} />
        </span>
        <div className="text-right">
          <p className="text-3xl font-black text-white">
            {Math.round(recommendation.scores.overall)}
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">robustez</p>
        </div>
      </div>
      <h3 className="mt-4 text-xl font-black text-white">{recommendation.name}</h3>
      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-zinc-600">
        {recommendation.modelVersion === 'agent-season-v3'
          ? `${integer.format(recommendation.simulationCount)} temporadas completas por shock`
          : 'Preselección estructural · pendiente de cálculo masivo'}
      </p>
      <p className="mt-2 min-h-12 text-xs leading-5 text-zinc-500">{recommendation.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {configSummary(recommendation.config).map((item) => (
          <span
            key={item}
            className="rounded-md border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[9px] font-bold text-zinc-400"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="my-5 h-px bg-white/[0.06]" />
      <ScoreBars scores={recommendation.scores} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/25 p-3">
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Recuperación media</p>
          <p className="mt-1 text-lg font-black text-emerald-300">
            {percent(recommendation.averageRecoveryProbability)}
          </p>
        </div>
        <div className="rounded-xl bg-black/25 p-3">
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Peor shock</p>
          <p className="mt-1 text-lg font-black text-white">
            {percent(recommendation.worstCaseRecoveryProbability)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onApply(recommendation.config)}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-xs font-black text-white transition hover:border-orange-400/40 hover:bg-orange-400/10"
      >
        Probar en el laboratorio <ArrowRight size={14} />
      </button>
    </Card>
  );
}

function RecoveryPanel({
  analysis,
  loading,
  observedTransfers,
}: {
  analysis: SeasonRecoveryAnalysis;
  loading: boolean;
  observedTransfers: number;
}) {
  const result = analysis.result;
  const comparisonData = [
    { label: 'Histórico', value: analysis.historicalResult.recoveryProbability * 100 },
    { label: 'Escenario', value: result.recoveryProbability * 100 },
  ];
  return (
    <div
      className={cx('relative space-y-5 transition-opacity', loading && 'opacity-45')}
      aria-live="polite"
      aria-busy={loading}
    >
      {loading && (
        <span className="absolute right-1 top-1 size-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Resultado del stress test
          </p>
          <p className="mt-2 text-4xl font-black tracking-tight text-white">
            {percent(result.recoveryProbability)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            temporadas donde el usuario recupera recursos y plantilla
          </p>
          {result.recoveryInterval95 ? (
            <p className="mt-2 text-[10px] font-bold text-zinc-600">
              Intervalo 95 %: {percent(result.recoveryInterval95[0])}–
              {percent(result.recoveryInterval95[1])}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-300">
            Confianza{' '}
            {result.confidence === 'high'
              ? 'alta'
              : result.confidence === 'medium'
                ? 'media'
                : 'baja'}
          </span>
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
            {integer.format(result.simulationCount)} temporadas · modelo por jugadores
          </p>
        </div>
      </div>
      {result.modelVersion === 'agent-season-v3' ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600">Gini económico</p>
            <p className="mt-1 text-lg font-black text-white">
              {giniNumber.format(result.medianFinalResourceGini || 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600">Gini plantilla</p>
            <p className="mt-1 text-lg font-black text-white">
              {giniNumber.format(result.medianFinalSquadGini || 0)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600">Aspirantes a mitad</p>
            <p className="mt-1 text-lg font-black text-white">
              {number.format(result.medianMidseasonContenders || 0)} de 7
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600">
              Movimientos simulados
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {integer.format(result.medianTransactions || 0)}
            </p>
            <p className="mt-1 text-[9px] font-bold text-zinc-600">
              {integer.format(observedTransfers)} movimientos reales
            </p>
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">
            Recuperación económica
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {percent(result.economicRecoveryProbability)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">
            Recuperación plantilla
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {percent(result.competitiveRecoveryProbability)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Tiempo mediano</p>
          <p className="mt-1 text-lg font-black text-white">
            {result.medianRecoveryRounds} jornadas
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
          <p className="text-[8px] uppercase tracking-widest text-zinc-600">Riesgo de bloqueo</p>
          <p className="mt-1 text-lg font-black text-red-300">
            {percent(result.lockInProbability)}
          </p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_.85fr]">
        <div
          className="h-56 rounded-2xl border border-white/[0.06] bg-black/20 p-3"
          role="img"
          aria-label="Probabilidad de recuperación histórica frente al escenario"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 12, bottom: 8 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,.05)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="#71717a"
                fontSize={9}
              />
              <YAxis type="category" dataKey="label" stroke="#a1a1aa" fontSize={10} width={62} />
              <Tooltip
                formatter={(value) => [`${number.format(Number(value))}%`, 'Recuperación']}
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="value" radius={[0, 7, 7, 0]}>
                {comparisonData.map((item, index) => (
                  <Cell key={item.label} fill={index === 0 ? '#52525b' : '#fa5001'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Perfil de la configuración
          </p>
          <div className="mt-4">
            <ScoreBars scores={analysis.scores} />
          </div>
          <div
            className={cx(
              'mt-4 rounded-xl border p-3 text-xs font-bold',
              analysis.deltaRecoveryProbability >= 0
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-red-400/20 bg-red-400/10 text-red-300'
            )}
          >
            {analysis.deltaRecoveryProbability >= 0 ? '+' : ''}
            {percent(analysis.deltaRecoveryProbability)} frente a las reglas históricas.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeasonReviewClient({ overview }: { overview: SeasonReviewOverviewV2 }) {
  const [historyMetric, setHistoryMetric] = useState<EvolutionMetric>('squadValue');
  const [historyView, setHistoryView] = useState<'all' | 'comparison'>('all');
  const [comparisonUsers, setComparisonUsers] = useState<[string, string]>([
    overview.autopsy.leaderId,
    overview.autopsy.laggardId,
  ]);
  const [contributionMoment, setContributionMoment] = useState<'midpoint' | 'closing'>('midpoint');
  const [config, setConfig] = useState<ResilienceConfig>(overview.historicalConfig);
  const [shock, setShock] = useState<ShockConfig>(overview.defaultShock);
  const [analysis, setAnalysis] = useState<SeasonRecoveryAnalysis>(overview.initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const response = await runSeasonReviewScenario({ config, shock });
        if (currentRequest !== requestId.current) return;
        if (response.success) {
          setAnalysis(response.data);
          setError(null);
        } else setError(response.error);
      });
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [config, shock]);

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
  const evolutionMilestones = useMemo(
    () =>
      buildEvolutionMilestones(
        overview.timeline,
        overview.autopsy.midpoint.day,
        historyView === 'comparison' ? comparisonUsers : undefined
      ),
    [comparisonUsers, historyView, overview.autopsy.midpoint.day, overview.timeline]
  );

  const selectedCap =
    overview.capDiagnostics.find((item) => item.cap === config.rosterCap) ||
    overview.capDiagnostics[0];
  const capChart = overview.capDiagnostics.map((item) => ({
    cap: item.cap,
    incumplimiento: item.breachRate * 100,
    minimo: item.averageMinimumReleaseValue / 1_000_000,
    maximo: item.averageMaximumReleaseValue / 1_000_000,
  }));
  const contributions =
    contributionMoment === 'midpoint'
      ? overview.autopsy.midpointContributions
      : overview.autopsy.closingContributions;

  function applyRecommendation(next: ResilienceConfig) {
    setConfig(next);
    document.getElementById('laboratorio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetHistorical() {
    setConfig(overview.historicalConfig);
    setShock(overview.defaultShock);
  }

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
        <Card className="p-6 md:p-9">
          <div className="absolute inset-y-0 right-0 hidden w-[44%] opacity-70 lg:block [background:radial-gradient(circle_at_center,rgba(250,80,1,.15),transparent_62%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
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
                <a
                  href="#autopsia"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-black transition hover:bg-orange-400"
                >
                  Ver autopsia <ArrowRight size={14} />
                </a>
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black text-white transition hover:bg-white/[0.09]"
                >
                  <Download size={14} /> Exportar evolución
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">
                  Patrimonio inicial
                </p>
                <p className="mt-3 text-3xl font-black text-white">40 M€</p>
                <p className="mt-1 text-xs text-zinc-500">exactos por usuario</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-600">
                  Plantilla inicial
                </p>
                <p className="mt-3 text-3xl font-black text-white">{overview.openingRosterSize}</p>
                <p className="mt-1 text-xs text-zinc-500">jugadores cada uno</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-sky-400/15 bg-sky-400/[0.07] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-sky-300">
                  Primera alarma
                </p>
                <p className="mt-2 text-xl font-black text-white">
                  Brecha de 10 M€ el{' '}
                  {overview.autopsy.firstTenMillionGapDay
                    ? shortDate(overview.autopsy.firstTenMillionGapDay)
                    : '—'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  entre {overview.autopsy.leaderName} y {overview.autopsy.laggardName}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Brecha a mitad"
            value={compactMoney.format(overview.autopsy.midpoint.resourceGap)}
            detail="recursos estimados entre líder y último"
            icon={TrendingUp}
          />
          <Metric
            label="Plantilla final"
            value={compactMoney.format(overview.autopsy.closing.squadGap)}
            detail="la diferencia competitiva que el efectivo ocultaba"
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
          <Metric
            label="Mercado completo"
            value={
              overview.quality.marketCoverageStart
                ? shortDate(overview.quality.marketCoverageStart)
                : 'Sin fecha'
            }
            detail="desde aquí conocemos todos los libres diarios"
            icon={ShieldCheck}
            tone="zinc"
          />
        </div>

        <Card id="evolucion" className="p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow tone="sky">01 · Evolución real</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
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
                    'rounded-lg px-3 py-2 text-[10px] font-black transition',
                    historyMetric === value
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-600 hover:text-zinc-300'
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
              <div
                className="flex rounded-xl border border-white/[0.08] bg-zinc-950 p-1"
                aria-label="Usuarios visibles en la gráfica"
              >
                <button
                  type="button"
                  onClick={() => setHistoryView('all')}
                  aria-pressed={historyView === 'all'}
                  className={cx(
                    'rounded-lg px-4 py-2 text-[10px] font-black transition',
                    historyView === 'all'
                      ? 'bg-orange-500 text-black'
                      : 'text-zinc-500 hover:text-white'
                  )}
                >
                  Todos ({allEvolutionUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryView('comparison')}
                  aria-pressed={historyView === 'comparison'}
                  className={cx(
                    'rounded-lg px-4 py-2 text-[10px] font-black transition',
                    historyView === 'comparison'
                      ? 'bg-sky-400 text-black'
                      : 'text-zinc-500 hover:text-white'
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
          <div
            className="mt-7 h-80"
            role="img"
            aria-label={
              historyView === 'all'
                ? `Evolución de ${historyMetric} para todos los usuarios`
                : `Comparación de ${historyMetric} entre ${historicalChart.series
                    .map((user) => user.name)
                    .join(' y ')}`
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historicalChart.data}
                margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={9} interval="preserveStartEnd" />
                <YAxis stroke="#71717a" fontSize={9} tickFormatter={(value) => `${value}M`} />
                <Tooltip
                  contentStyle={{
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 12,
                  }}
                  formatter={(value) => [`${number.format(Number(value))} M€`]}
                  labelFormatter={(_, rows) => rows?.[0]?.payload?.day || ''}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {historyMetric === 'totalResources' ? (
                  <ReferenceLine
                    y={40}
                    stroke="rgba(255,255,255,.16)"
                    strokeDasharray="4 5"
                    label={{ value: 'Inicio 40 M€', fill: '#71717a', fontSize: 9 }}
                  />
                ) : null}
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
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card id="hitos" className="p-5 md:p-7">
          <div className="pointer-events-none absolute right-0 top-0 size-72 rounded-full bg-sky-400/[0.055] blur-[110px]" />
          <div className="relative">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Eyebrow tone="sky">02 · Hitos comparables</Eyebrow>
                <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                  La temporada, en tres cortes
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                  Una lectura contable del inicio, la mitad y el cierre. La tarjeta sigue el filtro
                  de usuarios elegido en la gráfica anterior.
                </p>
              </div>
              <div
                className="flex items-center gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/[0.065] px-4 py-3"
                aria-live="polite"
              >
                <span className="grid size-9 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                  <Clock3 size={16} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-300">
                    Vista activa
                  </p>
                  <p className="mt-1 text-xs font-black text-white">
                    {historyView === 'all'
                      ? `${allEvolutionUsers.length} usuarios`
                      : historicalChart.series.map((user) => user.name).join(' vs. ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <MilestoneTable milestones={evolutionMilestones} />
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] leading-5 text-zinc-500">
                <span className="font-black text-zinc-300">Recursos totales</span> = valor de
                plantilla + saldo estimado.
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                Cifras individuales · no son brechas
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <Card id="autopsia" className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Eyebrow>03 · Autopsia de la brecha</Eyebrow>
                <h2 className="mt-4 text-2xl font-black text-white">Qué la creó y qué la frenó</h2>
              </div>
              <div className="flex rounded-lg border border-white/[0.07] bg-black/25 p-1">
                {(['midpoint', 'closing'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContributionMoment(value)}
                    className={cx(
                      'rounded-md px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider',
                      contributionMoment === value ? 'bg-white/10 text-white' : 'text-zinc-600'
                    )}
                  >
                    {value === 'midpoint' ? 'Mitad' : 'Final'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <ContributionList rows={contributions} />
            </div>
            <div className="mt-5 rounded-2xl border border-sky-400/15 bg-sky-400/[0.07] p-4">
              <p className="text-xs font-black text-sky-300">
                El reparto inicial no explica el liderazgo
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Con hindsight, los 13 jugadores iniciales de {overview.autopsy.leaderName} sumaron{' '}
                {integer.format(overview.autopsy.initialPotentialPoints.leader)} puntos potenciales;
                los de {overview.autopsy.laggardName},{' '}
                {integer.format(overview.autopsy.initialPotentialPoints.laggard)}. La distancia
                surgió después.
              </p>
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <Eyebrow tone="sky">04 · Límite de plantilla</Eyebrow>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Cada plaza entre 10 y 25</h2>
                <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">
                  La barra mide cuántos usuario-día habrían superado el límite. El rango de valor
                  muestra la presión de venta entre liberar los jugadores más baratos o los más
                  valiosos.
                </p>
              </div>
              <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-black text-white">
                Tope {config.rosterCap}
              </span>
            </div>
            <div
              className="mt-5 h-64"
              role="img"
              aria-label="Incumplimientos históricos para límites de plantilla entre 10 y 25"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capChart} margin={{ top: 10, right: 8, left: -15, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                  <XAxis dataKey="cap" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={9} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid rgba(255,255,255,.1)',
                      borderRadius: 12,
                    }}
                    formatter={(value) => [
                      `${number.format(Number(value))}%`,
                      'Usuario-día sobre el tope',
                    ]}
                  />
                  <Bar dataKey="incumplimiento" radius={[5, 5, 0, 0]}>
                    {capChart.map((item) => (
                      <Cell
                        key={item.cap}
                        fill={item.cap === config.rosterCap ? '#fa5001' : '#3f3f46'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-black/25 p-3">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600">Incumplimiento</p>
                <p className="mt-1 text-lg font-black text-white">
                  {percent(selectedCap.breachRate)}
                </p>
              </div>
              <div className="rounded-xl bg-black/25 p-3">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600">Afectados</p>
                <p className="mt-1 text-lg font-black text-white">{selectedCap.affectedUsers}/7</p>
              </div>
              <div className="rounded-xl bg-black/25 p-3">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600">Venta mínima</p>
                <p className="mt-1 text-lg font-black text-white">
                  {compactMoney.format(selectedCap.averageMinimumReleaseValue)}
                </p>
              </div>
              <div className="rounded-xl bg-black/25 p-3">
                <p className="text-[8px] uppercase tracking-widest text-zinc-600">Máx. exceso</p>
                <p className="mt-1 text-lg font-black text-white">+{selectedCap.maxExcess}</p>
              </div>
            </div>
          </Card>
        </div>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>05 · Configuraciones robustas</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                No gana quien acaba con menor Gini
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Gana la regla que resiste mejor malos fichajes, lesiones, rachas e inactividad
                usando los mismos shocks. Mientras no se publique el cálculo masivo, las tarjetas se
                muestran como una preselección y el laboratorio usa temporadas completas.
              </p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {overview.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onApply={applyRecommendation}
              />
            ))}
          </div>
        </section>

        <Card id="laboratorio" className="p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow tone="sky">06 · Laboratorio de recuperación</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                ¿Un error condiciona toda la temporada?
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Cada escenario reproduce temporadas completas con jugadores, precios, mercado,
                pujas, ventas, alineaciones, puntos y primas. Histórico y alternativa usan las
                mismas temporadas aleatorias.
              </p>
            </div>
            <button
              type="button"
              onClick={resetHistorical}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-black text-zinc-300 transition hover:bg-white/[0.09]"
            >
              <RotateCcw size={13} /> Reglas históricas
            </button>
          </div>
          <div className="mt-5 grid gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4 md:grid-cols-[auto_1fr_1fr]">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
                Calibración del modelo
              </p>
              <p
                className={cx(
                  'mt-2 text-sm font-black',
                  overview.simulationCalibration.status === 'strong'
                    ? 'text-emerald-300'
                    : overview.simulationCalibration.status === 'acceptable'
                      ? 'text-amber-300'
                      : 'text-red-300'
                )}
              >
                {overview.simulationCalibration.status === 'strong'
                  ? 'Fuerte'
                  : overview.simulationCalibration.status === 'acceptable'
                    ? 'Aceptable'
                    : 'Débil'}
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-zinc-600">Movimientos</p>
              <p className="mt-1 text-xs font-bold text-zinc-300">
                {integer.format(overview.simulationCalibration.simulatedMedianTransactions)}{' '}
                simulados
                {' · '}
                {integer.format(overview.simulationCalibration.observedTransfers)} reales
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-zinc-600">Gini al cierre</p>
              <p className="mt-1 text-xs font-bold text-zinc-300">
                Recursos{' '}
                {giniNumber.format(overview.simulationCalibration.simulatedFinalResourceGini)}
                {' / '}
                {giniNumber.format(overview.simulationCalibration.observedFinalResourceGini)} real
                {' · '}plantilla{' '}
                {giniNumber.format(overview.simulationCalibration.simulatedFinalSquadGini)}
                {' / '}
                {giniNumber.format(overview.simulationCalibration.observedFinalSquadGini)} real
              </p>
            </div>
          </div>
          <div className="mt-7 grid gap-7 xl:grid-cols-[320px_1fr]">
            <div className="space-y-5 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
              <RangeField
                label="Máximo de plantilla"
                value={config.rosterCap}
                min={10}
                max={25}
                suffix="jug."
                onChange={(rosterCap) => setConfig((current) => ({ ...current, rosterCap }))}
              />
              <RangeField
                label="Jugadores diarios de mercado"
                value={config.marketSlots}
                min={1}
                max={20}
                suffix="jug."
                onChange={(marketSlots) => setConfig((current) => ({ ...current, marketSlots }))}
              />
              <SelectField
                label="Dirección de la prima"
                value={config.payoutDirection}
                onChange={(payoutDirection) =>
                  setConfig((current) => ({
                    ...current,
                    payoutDirection: payoutDirection as ResilienceConfig['payoutDirection'],
                  }))
                }
              >
                <option value="inverse">Inversa</option>
                <option value="direct">Directa</option>
              </SelectField>
              <SelectField
                label="Importe por punto"
                value={config.eurosPerPoint}
                onChange={(eurosPerPoint) =>
                  setConfig((current) => ({ ...current, eurosPerPoint: Number(eurosPerPoint) }))
                }
              >
                <option value={5000}>5.000 €</option>
                <option value={7500}>7.500 €</option>
                <option value={10000}>10.000 €</option>
              </SelectField>
              <div className="h-px bg-white/[0.06]" />
              <SelectField
                label="Shock"
                value={shock.kind}
                onChange={(kind) =>
                  setShock((current) => ({ ...current, kind: kind as ShockConfig['kind'] }))
                }
              >
                {Object.entries(shockLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Gravedad"
                value={shock.severity}
                onChange={(severity) =>
                  setShock((current) => ({
                    ...current,
                    severity: severity as ShockConfig['severity'],
                  }))
                }
              >
                {Object.entries(severityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <RangeField
                label="Jornada del error"
                value={shock.appliedRound}
                min={1}
                max={35}
                suffix="J"
                onChange={(appliedRound) => setShock((current) => ({ ...current, appliedRound }))}
              />
              {config.rosterCap < overview.openingRosterSize && (
                <div className="flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-[10px] leading-4 text-amber-200">
                  <AlertTriangle className="mt-0.5 shrink-0" size={14} />
                  <span>
                    Este límite exige repartir menos de {overview.openingRosterSize} jugadores o
                    realizar cortes antes de empezar.
                  </span>
                </div>
              )}
            </div>
            <div>
              {error && (
                <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs font-bold text-red-300">
                  {error}
                </div>
              )}
              <RecoveryPanel
                analysis={analysis}
                loading={isPending}
                observedTransfers={overview.quality.transfers}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 md:p-7">
          <div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <Eyebrow>07 · Lectura correcta</Eyebrow>
              <h2 className="mt-4 text-2xl font-black text-white">Qué podemos afirmar</h2>
              <div className="mt-5 space-y-3">
                {[
                  [
                    'El mercado abrió la brecha',
                    'A mitad de temporada, fichajes y revalorizaciones aportaban la mayor diferencia entre líder y último.',
                    BarChart3,
                  ],
                  [
                    'La inversa amortiguó, no reparó',
                    'El último recibió más primas, pero acabó con mucho efectivo y una plantilla muy inferior.',
                    BadgeEuro,
                  ],
                  [
                    'El límite afecta a la liquidez',
                    'Reducir plazas libera jugadores; no garantiza por sí solo que el rezagado acierte en la siguiente compra.',
                    Gauge,
                  ],
                ].map(([title, detail, Icon]) => (
                  <div
                    key={String(title)}
                    className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-orange-400/20 bg-orange-400/10 text-orange-300">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-black text-zinc-200">{String(title)}</p>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-600">{String(detail)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Info size={16} className="text-sky-300" />
                <h3 className="text-sm font-black text-white">Supuestos y calidad</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {overview.quality.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-4 text-[11px] leading-5 text-zinc-500"
                  >
                    {warning}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  {integer.format(overview.quality.transfers)} fichajes
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  {integer.format(overview.quality.uniqueFinanceEvents)} primas únicas
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  {integer.format(overview.quality.marketSnapshotDays)} días de mercado
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5">
                  solo lectura
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold text-zinc-700">
          <FlaskConical size={13} />
          <span>Modelo v3 · temporadas completas emparejadas · jugadores y mercado 2025/26</span>
        </div>
      </div>
    </div>
  );
}
