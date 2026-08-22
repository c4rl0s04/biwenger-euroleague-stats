'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FlaskConical, LoaderCircle, Search, UsersRound } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EmergentPublicCatalog } from '@/lib/season-review/emergent-artifacts';
import type {
  EmergentConfigurationReport,
  EmergentRunDetail,
  EmergentRunSummary,
} from '@/lib/season-review/emergent-types';

const payouts = [5_000, 7_500, 10_000, 12_500, 15_000, 17_500] as const;
const money = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 });
const colors = ['#fb923c', '#38bdf8', '#34d399', '#facc15', '#f472b6', '#a78bfa', '#e4e4e7'];

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-zinc-950/75 shadow-2xl shadow-black/20">
      <div className="border-b border-white/[0.06] bg-[linear-gradient(120deg,rgba(249,115,22,.08),transparent_45%)] px-5 py-5 md:px-7">
        <p className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="p-5 md:p-7">{children}</div>
    </section>
  );
}

async function loadJson<Value>(url: string): Promise<Value> {
  const response = await fetch(url, { credentials: 'same-origin' });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'No se pudieron cargar los datos');
  return body as Value;
}

export default function EmergentAnalysisExplorer({
  catalog,
}: {
  catalog: EmergentPublicCatalog | null;
}) {
  const [selectedPayout, setSelectedPayout] = useState(10_000);
  const [selectedConfigId, setSelectedConfigId] = useState('s15-m20-inverse-10000');
  const [report, setReport] = useState<EmergentConfigurationReport | null>(null);
  const [runs, setRuns] = useState<EmergentRunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<EmergentRunDetail | null>(null);
  const [selectedRound, setSelectedRound] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showIndividualRuns = false as boolean;

  const ranking = useMemo(
    () => new Map(catalog?.ranking.map((entry) => [entry.config.configId, entry]) || []),
    [catalog]
  );
  const payoutConfigurations = useMemo(
    () =>
      (catalog?.configurations || [])
        .filter((entry) => entry.config.eurosPerPoint === selectedPayout)
        .sort((left, right) => left.config.rosterCap - right.config.rosterCap),
    [catalog, selectedPayout]
  );
  const capStudy = payoutConfigurations.map((entry) => {
    const ranked = ranking.get(entry.config.configId);
    return {
      cap: entry.config.rosterCap,
      balance: ranked?.balanceScore ?? 0,
      equality: ranked?.dimensions.economicEquality ?? 0,
      competition: ranked?.dimensions.competitiveBalance ?? 0,
      recovery: ranked?.dimensions.naturalRecovery ?? 0,
      hoarding: ranked?.dimensions.antiHoarding ?? 0,
    };
  });
  const cap15Analysis = catalog?.cap15Analysis?.find(
    (analysis) => analysis.eurosPerPoint === selectedPayout
  );

  useEffect(() => {
    if (!catalog?.configurations.some((entry) => entry.config.configId === selectedConfigId))
      return;
    let active = true;
    setLoading(true);
    setError(null);
    setReport(null);
    setRuns([]);
    setNextCursor(null);
    setSelectedRun(null);
    loadJson<{ data: EmergentConfigurationReport }>(
      `/api/season-review/configurations/${selectedConfigId}`
    )
      .then((reportResponse) => {
        if (!active) return;
        setReport(reportResponse.data);
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [catalog, selectedConfigId]);

  function chooseConfiguration(rosterCap: number) {
    setSelectedConfigId(`s${rosterCap}-m20-inverse-${selectedPayout}`);
  }

  function choosePayout(value: number) {
    setSelectedPayout(value);
    const currentCap = Number(selectedConfigId.match(/^s(\d+)/)?.[1] || 15);
    setSelectedConfigId(`s${currentCap}-m20-inverse-${value}`);
  }

  async function loadMore() {
    if (!nextCursor) return;
    const response = await loadJson<{
      data: EmergentRunSummary[];
      pagination: { nextCursor: string | null };
    }>(`/api/season-review/configurations/${selectedConfigId}/runs?limit=25&cursor=${nextCursor}`);
    setRuns((current) => [...current, ...response.data]);
    setNextCursor(response.pagination.nextCursor);
  }

  async function openRun(runId: string) {
    setLoading(true);
    try {
      const response = await loadJson<{ data: EmergentRunDetail }>(
        `/api/season-review/configurations/${selectedConfigId}/runs/${runId}`
      );
      setSelectedRun(response.data);
      setSelectedRound(response.data.timeline.at(-1)?.round || 0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la simulación');
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    if (!report) return;
    const rows = [
      ['jornada', 'gini_medio', 'gini_p05', 'gini_p95', 'brecha_media', 'aspirantes_medios'],
      ...report.timeline.map((point) => [
        point.round,
        point.resourceGini.mean,
        point.resourceGini.quantiles.p05,
        point.resourceGini.quantiles.p95,
        point.resourceGap.mean,
        point.titleContenders.mean,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedConfigId}-informe-v5.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!catalog) {
    return (
      <Panel eyebrow="Motor V5 preparado" title="Simulaciones emergentes pendientes de publicación">
        <p className="max-w-3xl text-sm leading-7 text-zinc-400">
          La aplicación ya está preparada para leer los agregados de los 96 escenarios. La evolución
          media, sus bandas y las comparaciones aparecerán cuando termine la primera ejecución de
          2.048 temporadas.
        </p>
      </Panel>
    );
  }

  const highlighted = [15, 20, 25].map((cap) => ({
    cap,
    row: capStudy.find((item) => item.cap === cap),
  }));
  const runChart = selectedRun?.timeline.map((point) => ({
    round: point.round,
    ...Object.fromEntries(point.users.map((user) => [user.userId, user.totalResources])),
  }));
  const selectedRunPoint = selectedRun?.timeline.find((point) => point.round === selectedRound);
  const selectedRoundTransactions = selectedRun?.transactions.filter(
    (transaction) => transaction.round === selectedRound
  );
  const selectedRoundListings = selectedRun?.marketListings.filter(
    (listing) => listing.round === selectedRound
  );

  return (
    <div className="space-y-8" id="simulador-v5">
      <Panel
        eyebrow="Pregunta principal"
        title="¿Qué cambia realmente al limitar la plantilla a 15?"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm leading-7 text-zinc-400">
              Cada punto compara temporadas con la misma semilla. Prima inversa y mercado de 20
              permanecen fijos; solo cambian el límite y el dinero por punto.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black text-sky-300">
                MERCADO · 20
              </span>
              <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-[10px] font-black text-orange-300">
                PRIMA · INVERSA
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black text-zinc-300">
                {catalog.baseRuns.toLocaleString('es-ES')}–
                {catalog.finalistRuns.toLocaleString('es-ES')} TEMPORADAS
              </span>
            </div>
          </div>
          <label className="block min-w-56 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
            Prima por punto
            <select
              value={selectedPayout}
              onChange={(event) => choosePayout(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-black text-white outline-none focus:border-orange-400"
            >
              {payouts.map((value) => (
                <option key={value} value={value}>
                  {value.toLocaleString('es-ES')} €
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="mt-7 h-80 rounded-2xl border border-white/[0.06] bg-black/30 p-3"
          aria-label="Puntuación por límite de plantilla"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={capStudy} margin={{ top: 16, right: 16, left: -12, bottom: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="cap" stroke="#71717a" fontSize={10} />
              <YAxis domain={[0, 100]} stroke="#71717a" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                name="Equilibrio global"
                stroke="#fb923c"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="hoarding"
                name="Antiacaparamiento"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="recovery"
                name="Recuperación"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {highlighted.map(({ cap, row }) => (
            <button
              key={cap}
              type="button"
              onClick={() => chooseConfiguration(cap)}
              className={`rounded-2xl border p-4 text-left transition ${selectedConfigId.startsWith(`s${cap}-`) ? 'border-orange-400/50 bg-orange-400/10' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/20'}`}
            >
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Límite {cap}
              </span>
              <span className="mt-2 block text-3xl font-black text-white">
                {number.format(row?.balance || 0)}
              </span>
              <span className="text-xs text-zinc-500">equilibrio global</span>
            </button>
          ))}
        </div>
        {cap15Analysis ? (
          <div className="mt-5 rounded-2xl border border-sky-400/15 bg-sky-400/[0.055] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-300">
                  Veredicto emparejado del límite 15
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Ocupa el puesto <strong>{cap15Analysis.cap15Rank}</strong> de 16; el mejor límite
                  para esta prima es <strong>{cap15Analysis.bestCap}</strong>. Su diferencia global
                  frente al mejor es de{' '}
                  <strong>{number.format(cap15Analysis.balanceDeltaToBest)} puntos</strong>.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-black ${cap15Analysis.isRecommended ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'}`}
              >
                {cap15Analysis.isRecommended ? 'RECOMENDABLE' : 'CON RESERVAS'}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs text-zinc-400">
                <thead>
                  <tr>
                    <th className="p-2">Comparado con</th>
                    <th className="p-2">Menor desigualdad</th>
                    <th className="p-2">Δ desigualdad (IC 95 %)</th>
                    <th className="p-2">Δ concentración (IC 95 %)</th>
                    <th className="p-2">Δ recuperación</th>
                  </tr>
                </thead>
                <tbody>
                  {cap15Analysis.comparisons
                    .filter(
                      (comparison) => comparison.comparedCap === 20 || comparison.comparedCap === 25
                    )
                    .map((comparison) => (
                      <tr key={comparison.comparedCap} className="border-t border-white/[0.05]">
                        <td className="p-2 font-black text-white">
                          Límite {comparison.comparedCap}
                        </td>
                        <td className="p-2">
                          {percent.format(comparison.probabilityLowerInequality)}
                        </td>
                        <td className="p-2">
                          {number.format(comparison.resourceInequalityDelta.mean)} (
                          {number.format(comparison.resourceInequalityDelta.interval95[0])}–
                          {number.format(comparison.resourceInequalityDelta.interval95[1])})
                        </td>
                        <td className="p-2">
                          {percent.format(comparison.talentConcentrationDelta.mean)} (
                          {percent.format(comparison.talentConcentrationDelta.interval95[0])}–
                          {percent.format(comparison.talentConcentrationDelta.interval95[1])})
                        </td>
                        <td className="p-2">{percent.format(comparison.recoveryDelta.mean)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel eyebrow="96 configuraciones" title="Explorador controlado">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
              <tr className="border-b border-white/[0.07]">
                <th className="px-3 py-3">Plantilla</th>
                <th className="px-3 py-3">Equilibrio</th>
                <th className="px-3 py-3">Igualdad</th>
                <th className="px-3 py-3">Competición</th>
                <th className="px-3 py-3">Recuperación</th>
                <th className="px-3 py-3">Antiacaparamiento</th>
                <th className="px-3 py-3">Muestra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {payoutConfigurations.map((entry) => {
                const row = ranking.get(entry.config.configId);
                return (
                  <tr
                    key={entry.config.configId}
                    onClick={() => chooseConfiguration(entry.config.rosterCap)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        chooseConfiguration(entry.config.rosterCap);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer hover:bg-white/[0.03] ${selectedConfigId === entry.config.configId ? 'bg-orange-500/10' : ''}`}
                  >
                    <td className="px-3 py-3 font-black text-white">{entry.config.rosterCap}</td>
                    <td className="px-3 py-3 font-black text-orange-300">
                      {number.format(row?.balanceScore || 0)}
                    </td>
                    <td className="px-3 py-3">
                      {number.format(row?.dimensions.economicEquality || 0)}
                    </td>
                    <td className="px-3 py-3">
                      {number.format(row?.dimensions.competitiveBalance || 0)}
                    </td>
                    <td className="px-3 py-3">
                      {number.format(row?.dimensions.naturalRecovery || 0)}
                    </td>
                    <td className="px-3 py-3">
                      {number.format(row?.dimensions.antiHoarding || 0)}
                    </td>
                    <td className="px-3 py-3 text-zinc-500">
                      {entry.sampleSize.toLocaleString('es-ES')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel eyebrow="Informe medio" title={`Evolución de ${selectedConfigId}`}>
        {loading && !report ? <LoaderCircle className="animate-spin text-orange-400" /> : null}
        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}
        {report ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Gini final medio', number.format(report.metrics.finalResourceGini.mean)],
                ['Recuperación en 10', percent.format(report.metrics.naturalRecoveryTen.mean)],
                [
                  'Concentración talento',
                  percent.format(report.metrics.topTalentConcentration.mean),
                ],
                [
                  'Compra de rezagados',
                  percent.format(report.metrics.laggardAcquisitionShare.mean),
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[0.06] bg-black/25 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={exportReport}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-zinc-300 hover:bg-white/[0.05]"
              >
                <Download size={14} /> Exportar CSV
              </button>
            </div>
            <div className="mt-4 h-80 rounded-2xl border border-white/[0.06] bg-black/30 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.timeline} margin={{ top: 15, right: 15, left: -8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                  <XAxis dataKey="round" stroke="#71717a" fontSize={10} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={10}
                    tickFormatter={(value) => number.format(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: 12,
                    }}
                    formatter={(value) => number.format(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="resourceGini.quantiles.p05"
                    name="Percentil 5"
                    stroke="#52525b"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="resourceGini.mean"
                    name="Gini medio"
                    stroke="#fb923c"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="resourceGini.quantiles.p95"
                    name="Percentil 95"
                    stroke="#a1a1aa"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <summary className="cursor-pointer text-xs font-black text-zinc-300">
                Tabla accesible de la evolución media
              </summary>
              <div className="mt-4 max-h-80 overflow-auto">
                <table className="w-full text-left text-xs text-zinc-400">
                  <thead>
                    <tr>
                      <th className="p-2">Jornada</th>
                      <th className="p-2">Gini medio</th>
                      <th className="p-2">P5–P95</th>
                      <th className="p-2">Brecha media</th>
                      <th className="p-2">Aspirantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.timeline.map((point) => (
                      <tr key={point.round} className="border-t border-white/[0.04]">
                        <td className="p-2">{point.round}</td>
                        <td className="p-2">{number.format(point.resourceGini.mean)}</td>
                        <td className="p-2">
                          {number.format(point.resourceGini.quantiles.p05)}–
                          {number.format(point.resourceGini.quantiles.p95)}
                        </td>
                        <td className="p-2">{money.format(point.resourceGap.mean)} €</td>
                        <td className="p-2">{number.format(point.titleContenders.mean)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : null}
      </Panel>

      {showIndividualRuns && (
        <Panel eyebrow="Auditoría reproducible" title="Temporadas individuales">
          <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
                <Search size={14} /> Selecciona cualquier semilla
              </div>
              <div className="max-h-[32rem] overflow-auto rounded-2xl border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-zinc-950 text-zinc-500">
                    <tr>
                      <th className="p-3">Ejecución</th>
                      <th className="p-3">Gini</th>
                      <th className="p-3">Brecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {runs.map((run) => (
                      <tr
                        key={run.runId}
                        onClick={() => openRun(run.runId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void openRun(run.runId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer text-zinc-400 hover:bg-white/[0.04]"
                      >
                        <td className="p-3 font-black text-white">{run.runId}</td>
                        <td className="p-3">{number.format(run.finalResourceGini)}</td>
                        <td className="p-3">{money.format(run.finalResourceGap)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {nextCursor ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="mt-3 w-full rounded-xl border border-white/10 py-2 text-xs font-black text-zinc-300 hover:bg-white/[0.04]"
                >
                  Cargar 25 más
                </button>
              ) : null}
            </div>
            <div className="min-h-80 rounded-2xl border border-white/[0.06] bg-black/25 p-4">
              {selectedRun ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-400">
                        Detalle completo
                      </p>
                      <h3 className="mt-1 text-xl font-black text-white">{selectedRun.runId}</h3>
                    </div>
                    <UsersRound className="text-zinc-600" />
                  </div>
                  <div className="mt-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={runChart}>
                        <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                        <XAxis dataKey="round" stroke="#71717a" fontSize={9} />
                        <YAxis
                          stroke="#71717a"
                          fontSize={9}
                          tickFormatter={(value) => money.format(value)}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#09090b',
                            border: '1px solid #27272a',
                            borderRadius: 12,
                          }}
                          formatter={(value) => `${money.format(Number(value))} €`}
                        />
                        {selectedRun.profiles.map((profile, index) => (
                          <Line
                            key={profile.userId}
                            type="monotone"
                            dataKey={profile.userId}
                            name={`${profile.userId} · ${profile.profile.id}`}
                            stroke={colors[index % colors.length]}
                            dot={false}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="text-lg font-black text-white">
                        {selectedRun.transactions.length}
                      </p>
                      <p className="text-[9px] text-zinc-500">operaciones</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="text-lg font-black text-white">
                        {selectedRun.marketListings.length}
                      </p>
                      <p className="text-[9px] text-zinc-500">apariciones</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <p className="text-lg font-black text-white">
                        {selectedRun.marketListings.reduce(
                          (sum, listing) => sum + listing.bids.length,
                          0
                        )}
                      </p>
                      <p className="text-[9px] text-zinc-500">pujas</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                      Auditar jornada
                    </p>
                    <select
                      value={selectedRound}
                      onChange={(event) => setSelectedRound(Number(event.target.value))}
                      className="rounded-lg border border-white/10 bg-black px-3 py-2 text-xs font-black text-white"
                    >
                      {selectedRun.timeline.map((point) => (
                        <option key={point.round} value={point.round}>
                          {point.round === 0 ? 'Punto inicial' : `Jornada ${point.round}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedRunPoint ? (
                    <div className="mt-4 space-y-3">
                      <details className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <summary className="cursor-pointer text-xs font-black text-zinc-300">
                          Plantillas y alineaciones
                        </summary>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full min-w-[650px] text-left text-[10px] text-zinc-400">
                            <thead>
                              <tr>
                                <th className="p-2">Usuario</th>
                                <th className="p-2">Saldo</th>
                                <th className="p-2">Plantilla</th>
                                <th className="p-2">Recursos</th>
                                <th className="p-2">Jugadores (* alineado)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRunPoint.users.map((user) => {
                                const lineup = new Set(user.lineupPlayerIds);
                                return (
                                  <tr key={user.userId} className="border-t border-white/[0.04]">
                                    <td className="p-2 font-black text-white">{user.userId}</td>
                                    <td className="p-2">{money.format(user.cash)} €</td>
                                    <td className="p-2">{money.format(user.squadValue)} €</td>
                                    <td className="p-2">{money.format(user.totalResources)} €</td>
                                    <td className="p-2">
                                      {user.rosterPlayers
                                        .map(
                                          (player) =>
                                            `${player.playerId}${lineup.has(player.playerId) ? '*' : ''} · ${money.format(player.price)}€`
                                        )
                                        .join(', ')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                      <details className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <summary className="cursor-pointer text-xs font-black text-zinc-300">
                          Operaciones ({selectedRoundTransactions?.length || 0})
                        </summary>
                        <div className="mt-3 max-h-64 overflow-auto">
                          <table className="w-full text-left text-[10px] text-zinc-400">
                            <thead>
                              <tr>
                                <th className="p-2">Día</th>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Usuario</th>
                                <th className="p-2">Jugador</th>
                                <th className="p-2">Importe</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRoundTransactions?.map((transaction, index) => (
                                <tr
                                  key={`${transaction.marketDay}-${transaction.playerId}-${index}`}
                                  className="border-t border-white/[0.04]"
                                >
                                  <td className="p-2">{transaction.marketDay + 1}</td>
                                  <td className="p-2">
                                    {transaction.type === 'buy' ? 'Compra' : 'Venta'}
                                  </td>
                                  <td className="p-2">{transaction.userId}</td>
                                  <td className="p-2">{transaction.playerId}</td>
                                  <td className="p-2">{money.format(transaction.amount)} €</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                      <details className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <summary className="cursor-pointer text-xs font-black text-zinc-300">
                          Mercado y pujas ({selectedRoundListings?.length || 0})
                        </summary>
                        <div className="mt-3 max-h-72 overflow-auto">
                          <table className="w-full text-left text-[10px] text-zinc-400">
                            <thead>
                              <tr>
                                <th className="p-2">Día</th>
                                <th className="p-2">Jugador</th>
                                <th className="p-2">Valor</th>
                                <th className="p-2">Pujas</th>
                                <th className="p-2">Ganador</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRoundListings?.map((listing) => (
                                <tr
                                  key={`${listing.marketDay}-${listing.playerId}`}
                                  className="border-t border-white/[0.04]"
                                >
                                  <td className="p-2">{listing.marketDay + 1}</td>
                                  <td className="p-2 font-black text-white">{listing.playerId}</td>
                                  <td className="p-2">{money.format(listing.marketValue)} €</td>
                                  <td className="p-2">
                                    {listing.bids.length
                                      ? listing.bids
                                          .map(
                                            (bid) =>
                                              `${bid.userId}: ${money.format(bid.amount)}€${bid.replacementPlayerId ? ` (sale ${bid.replacementPlayerId})` : ''}`
                                          )
                                          .join(' · ')
                                      : 'Sin pujas'}
                                  </td>
                                  <td className="p-2">{listing.winnerUserId || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <FlaskConical className="text-zinc-700" size={38} />
                  <p className="mt-4 text-sm font-black text-zinc-300">
                    Abre una ejecución para inspeccionarla
                  </p>
                  <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-600">
                    Verás la evolución de los siete agentes y el detalle almacenado de mercado,
                    plantillas y pujas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
