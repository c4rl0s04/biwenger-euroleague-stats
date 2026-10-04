'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, Clock3, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Button, PageCanvas, PageHeader, PageSection } from '@/components/ui/foundation';
import type { LiveMarketListing } from '../../live/models/live-bidding';
import type { PersonalBidWorkspace } from '../models/personal-bids';

const euro = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value)
  );
const shell =
  'rounded-2xl border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-card))]';
const muted = 'text-[hsl(var(--content-secondary))]';

const statusLabel = {
  pending: 'Programada',
  running: 'Por comprobar',
  submitted: 'Enviada',
  skipped: 'Omitida',
  uncertain: 'Resultado incierto',
  failed: 'Fallida',
  cancelled: 'Cancelada',
} as const;
const resultLabel: Record<string, string> = {
  bid_submitted: 'Oferta enviada a Biwenger',
  cancelled_by_user: 'Cancelada por ti',
  provider_outcome_unknown: 'Comprueba la oferta en Biwenger antes de actuar',
  existing_offer: 'Ya existía una puja tuya',
  own_offer: 'Ya existía una puja tuya',
  listing_changed: 'El anuncio cambió',
  listing_closed: 'El anuncio cerró',
  amount_out_of_range: 'El importe ya no era válido',
  too_late: 'Llegó demasiado cerca del cierre',
  count_unavailable: 'No se pudo consultar el número de pujas',
  execution_failed: 'No se pudo completar la comprobación',
  queue_publish_failed: 'No se pudo programar el envío remoto',
};

type Confirmation = { kind: 'now' | 'schedule'; summary: string } | null;

export function PersonalBidsScreen({ initialData }: { initialData: PersonalBidWorkspace }) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'deadline' | 'price'>('deadline');
  const [count, setCount] = useState<number | null>(null);
  const [countMessage, setCountMessage] = useState('');
  const [loadingCount, setLoadingCount] = useState(false);
  const [amount, setAmount] = useState('');
  const [withoutBids, setWithoutBids] = useState('');
  const [withBids, setWithBids] = useState('');
  const [minutes, setMinutes] = useState('5');
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy);

  const selected = data.market.listings.find((item) => item.playerId === selectedId) ?? null;
  const activeRule =
    selected &&
    data.rules.find(
      (rule) =>
        rule.playerId === selected.playerId &&
        rule.closesAt === selected.closesAt &&
        (rule.status === 'pending' ||
          rule.status === 'running' ||
          rule.status === 'submitted' ||
          rule.status === 'uncertain')
    );
  const filtered = useMemo(
    () =>
      data.market.listings
        .filter((item) =>
          `${item.playerName} ${item.sellerName}`
            .toLocaleLowerCase('es')
            .includes(search.toLocaleLowerCase('es'))
        )
        .sort((a, b) =>
          sort === 'deadline' ? Date.parse(a.closesAt) - Date.parse(b.closesAt) : b.price - a.price
        ),
    [data.market.listings, search, sort]
  );
  const groups = useMemo(() => {
    const result = new Map<string, LiveMarketListing[]>();
    for (const listing of filtered) {
      const key = listing.sellerId === null ? 'market' : String(listing.sellerId);
      result.set(key, [...(result.get(key) ?? []), listing]);
    }
    return Array.from(result.entries());
  }, [filtered]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setCount(null);
    setCountMessage('');
    setLoadingCount(true);
    fetch(`/api/personal/bids/count?playerId=${selectedId}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? 'No se pudo consultar el contador.');
        setCount(result.totalBids);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setCountMessage(
            reason instanceof Error ? reason.message : 'No se pudo consultar el contador.'
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCount(false);
      });
    return () => controller.abort();
  }, [selectedId, data.market.observedAt]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!confirmation) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) setConfirmation(null);
      }
      if (event.key !== 'Tab' || !buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [confirmation]);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch('/api/personal/bids/market', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'No se pudo actualizar el mercado.');
      setData(result);
      setSelectedId((id) =>
        result.market.listings.some((item: LiveMarketListing) => item.playerId === id) ? id : null
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar.');
    } finally {
      setRefreshing(false);
    }
  }

  function select(listing: LiveMarketListing) {
    setSelectedId(listing.playerId);
    setAmount('');
    setWithoutBids('');
    setWithBids('');
    setMinutes('5');
    setConfirmation(null);
    setNotice('');
    setError('');
  }

  function validateAmount(raw: string) {
    const value = Number(raw);
    if (
      !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(value) ||
      !selected ||
      value < selected.price ||
      value > data.market.maximumBid
    ) {
      setError(
        `Introduce euros enteros entre ${euro(selected?.price ?? 0)} y ${euro(data.market.maximumBid)}.`
      );
      return null;
    }
    return value;
  }

  function prepare(kind: 'now' | 'schedule') {
    setError('');
    setNotice('');
    if (!selected || selected.isOwnListing || selected.ownWaitingOffers.length || activeRule)
      return;
    if (kind === 'now') {
      const value = validateAmount(amount);
      if (value === null) return;
      setConfirmation({ kind, summary: `${selected.playerName} · puja ahora ${euro(value)}` });
    } else {
      const a = validateAmount(withoutBids);
      const b = validateAmount(withBids);
      const offset = Number(minutes);
      if (a === null || b === null) return;
      if (!Number.isInteger(offset) || offset < 3 || offset > 60) {
        setError('Elige entre 3 y 60 minutos antes del cierre.');
        return;
      }
      setConfirmation({
        kind,
        summary: `${selected.playerName} · ${euro(a)} sin otras pujas / ${euro(b)} con otras pujas · ${offset} min antes del cierre`,
      });
    }
  }

  async function send() {
    if (!confirmation || !selected) return;
    const kind = confirmation.kind;
    const expectedListing = {
      sellerId: selected.sellerId,
      price: selected.price,
      closesAt: selected.closesAt,
    };
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        kind === 'now' ? '/api/personal/bids/place' : '/api/personal/bids/rules',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            kind === 'now'
              ? { playerId: selected.playerId, expectedListing, amount: Number(amount) }
              : {
                  playerId: selected.playerId,
                  expectedListing,
                  amountWithoutBids: Number(withoutBids),
                  amountWithBids: Number(withBids),
                  minutesBeforeClose: Number(minutes),
                }
          ),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'No se pudo guardar la puja.');
      setNotice(
        kind === 'now'
          ? 'Puja enviada. Comprueba la oferta en Biwenger.'
          : 'Puja programada en el servidor.'
      );
      setConfirmation(null);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/personal/bids/rules/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'No se pudo cancelar.');
      setNotice('Puja programada cancelada.');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cancelar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageCanvas className="pb-2">
        <PageHeader
          title="Pujas privadas"
          description="Mercado de hoy y tus instrucciones personales de compra."
        />
      </PageCanvas>
      <div className="sticky top-16 z-30 border-y border-[hsl(var(--border-default))] bg-[hsl(var(--surface-app)/0.96)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
          <div>
            <span className={`block text-xs ${muted}`}>Saldo disponible</span>
            <strong className="text-lg text-[hsl(var(--content-primary))]">
              {euro(data.market.balance)}
            </strong>
          </div>
          <div>
            <span className={`block text-xs ${muted}`}>Puja máxima</span>
            <strong className="text-lg text-[hsl(var(--action-primary))]">
              {euro(data.market.maximumBid)}
            </strong>
          </div>
          <span className={`ml-auto text-xs ${muted}`}>
            Actualizado {date(data.market.observedAt)}
          </span>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Actualizar
          </Button>
        </div>
      </div>
      <PageSection className="pt-6">
        {notice && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"
          >
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm"
          >
            {error}
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              <label className={`${shell} flex min-w-52 flex-1 items-center gap-2 px-3`}>
                <Search size={17} aria-hidden="true" />
                <span className="sr-only">Buscar jugador o propietario</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar jugador o propietario"
                  className="min-h-11 w-full bg-transparent text-sm outline-none"
                />
              </label>
              <label className={`${shell} flex items-center gap-2 px-3`}>
                <ArrowDownUp size={16} aria-hidden="true" />
                <span className="sr-only">Ordenar</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as 'deadline' | 'price')}
                  className="min-h-11 bg-transparent text-sm"
                >
                  <option value="deadline">Próximo cierre</option>
                  <option value="price">Mayor precio</option>
                </select>
              </label>
            </div>
            <p className={`text-sm ${muted}`}>
              {filtered.length} jugadores · agrupados por propietario
            </p>
            {groups.length === 0 && (
              <div className={`${shell} p-6 text-sm ${muted}`}>
                {search
                  ? 'No hay jugadores para esta búsqueda.'
                  : 'No hay jugadores en el mercado ahora.'}
              </div>
            )}
            {groups.map(([ownerId, listings]) => (
              <section
                key={ownerId}
                className={`${shell} overflow-hidden`}
                aria-label={`Jugadores de ${listings[0]?.sellerName || 'Mercado'}`}
              >
                <div className="flex justify-between border-b border-[hsl(var(--border-default))] px-4 py-3">
                  <h2 className="font-semibold">{listings[0]?.sellerName || 'Mercado'}</h2>
                  <span className={`text-sm ${muted}`}>{listings.length}</span>
                </div>
                <div className="divide-y divide-[hsl(var(--border-default))]">
                  {listings.map((listing) => (
                    <button
                      key={`${listing.playerId}-${listing.closesAt}`}
                      type="button"
                      onClick={() => select(listing)}
                      aria-pressed={selectedId === listing.playerId}
                      className={`flex min-h-18 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--surface-section-alternate))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--action-primary))] ${selectedId === listing.playerId ? 'bg-[hsl(var(--action-primary)/0.12)]' : ''}`}
                    >
                      <span className="min-w-0">
                        <strong className="block truncate">{listing.playerName}</strong>
                        <span className={`block text-xs ${muted}`}>
                          <Clock3 size={12} className="mr-1 inline" />
                          {date(listing.closesAt)}
                          {listing.ownWaitingOffers.length ? ' · Ya has pujado' : ''}
                        </span>
                      </span>
                      <strong className="shrink-0 text-sm">{euro(listing.price)}</strong>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {!selected ? (
              <div className={`${shell} p-6 text-sm ${muted}`}>
                Selecciona un jugador para consultar sus pujas y preparar una oferta.
              </div>
            ) : (
              <div className={`${shell} space-y-5 p-5 sm:p-6`}>
                <div>
                  <p className={`text-xs uppercase tracking-widest ${muted}`}>
                    Jugador seleccionado
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">{selected.playerName}</h2>
                  <p className={`text-sm ${muted}`}>
                    {selected.sellerName} · cierre {date(selected.closesAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className={muted}>Precio</span>
                    <strong className="block">{euro(selected.price)}</strong>
                  </div>
                  <div>
                    <span className={muted}>Tu máximo</span>
                    <strong className="block">{euro(data.market.maximumBid)}</strong>
                  </div>
                  <div>
                    <span className={muted}>Otras pujas</span>
                    <strong className="block">
                      {loadingCount ? 'Consultando…' : count === null ? 'No disponible' : count}
                    </strong>
                  </div>
                  <div>
                    <span className={muted}>Tu oferta</span>
                    <strong className="block">
                      {selected.ownWaitingOffers.length
                        ? selected.ownWaitingOffers[0].amount === null
                          ? 'Enviada'
                          : euro(selected.ownWaitingOffers[0].amount)
                        : 'Ninguna'}
                    </strong>
                  </div>
                </div>
                {countMessage && <p className={`text-xs ${muted}`}>{countMessage}</p>}
                {(selected.isOwnListing || selected.ownWaitingOffers.length) && (
                  <p className="rounded-xl bg-[hsl(var(--surface-section-alternate))] p-3 text-sm">
                    {selected.isOwnListing
                      ? 'Este jugador es tuyo.'
                      : 'Tu puja actual prevalece. No se enviará otra.'}
                  </p>
                )}
                {activeRule && (
                  <div className="rounded-xl border border-[hsl(var(--action-primary)/0.4)] p-3 text-sm">
                    <strong>{statusLabel[activeRule.status]}</strong>
                    <p className={muted}>
                      {date(activeRule.executeAt)} · {euro(activeRule.amountWithoutBids)} /{' '}
                      {euro(activeRule.amountWithBids)}
                    </p>
                    {activeRule.status === 'pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        disabled={busy}
                        onClick={() => cancel(activeRule.id)}
                      >
                        Cancelar programación
                      </Button>
                    )}
                  </div>
                )}
                {!selected.isOwnListing && !selected.ownWaitingOffers.length && !activeRule && (
                  <>
                    <div className="space-y-3 border-t border-[hsl(var(--border-default))] pt-4">
                      <h3 className="font-semibold">Pujar ahora</h3>
                      <label className="block text-sm">
                        Importe en euros
                        <input
                          type="number"
                          inputMode="numeric"
                          min={selected.price}
                          max={data.market.maximumBid}
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className={`${shell} mt-1 min-h-11 w-full px-3`}
                        />
                      </label>
                      <Button
                        onClick={() => prepare('now')}
                        disabled={busy || data.market.maximumBid < selected.price}
                      >
                        Preparar puja
                      </Button>
                    </div>
                    <div className="space-y-3 border-t border-[hsl(var(--border-default))] pt-4">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <ShieldCheck size={18} />
                        Programar según otras pujas
                      </h3>
                      {!data.schedulingAvailable && (
                        <p className="text-sm text-[hsl(var(--status-danger))]">
                          La programación remota aún no está configurada.
                        </p>
                      )}
                      <p className={`text-xs ${muted}`}>
                        El contador se consultará de nuevo al ejecutar. Si ya has pujado, se omite
                        esta regla.
                      </p>
                      <label className="block text-sm">
                        Sin otras pujas
                        <input
                          type="number"
                          inputMode="numeric"
                          min={selected.price}
                          max={data.market.maximumBid}
                          value={withoutBids}
                          onChange={(event) => setWithoutBids(event.target.value)}
                          className={`${shell} mt-1 min-h-11 w-full px-3`}
                        />
                      </label>
                      <label className="block text-sm">
                        Con una o más pujas
                        <input
                          type="number"
                          inputMode="numeric"
                          min={selected.price}
                          max={data.market.maximumBid}
                          value={withBids}
                          onChange={(event) => setWithBids(event.target.value)}
                          className={`${shell} mt-1 min-h-11 w-full px-3`}
                        />
                      </label>
                      <label className="block text-sm">
                        Minutos antes del cierre
                        <input
                          type="number"
                          inputMode="numeric"
                          min="3"
                          max="60"
                          value={minutes}
                          onChange={(event) => setMinutes(event.target.value)}
                          className={`${shell} mt-1 min-h-11 w-full px-3`}
                        />
                      </label>
                      <Button
                        variant="secondary"
                        onClick={() => prepare('schedule')}
                        disabled={
                          busy ||
                          !data.schedulingAvailable ||
                          data.market.maximumBid < selected.price
                        }
                      >
                        Preparar programación
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </PageSection>
      <PageSection tone="alternate" className="pt-4">
        <h2 className="mb-4 text-xl font-semibold">Tus instrucciones</h2>
        {data.rules.length === 0 ? (
          <p className={`text-sm ${muted}`}>Todavía no hay pujas programadas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.rules.map((rule) => (
              <div key={rule.id} className={`${shell} p-4 text-sm`}>
                <div className="flex items-start justify-between gap-2">
                  <strong>{rule.playerName}</strong>
                  <span className="rounded-full bg-[hsl(var(--surface-section-alternate))] px-2 py-1 text-xs">
                    {statusLabel[rule.status]}
                  </span>
                </div>
                <p className={`mt-2 ${muted}`}>Ejecución {date(rule.executeAt)}</p>
                <p>
                  {euro(rule.amountWithoutBids)} sin pujas · {euro(rule.amountWithBids)} con pujas
                </p>
                {rule.submittedAmount !== null && <p>Enviada: {euro(rule.submittedAmount)}</p>}
                {rule.resultCode && rule.resultCode !== 'claim_started' && (
                  <p className={`text-xs ${muted}`}>
                    {resultLabel[rule.resultCode] ?? 'Comprueba el resultado en Biwenger'}
                  </p>
                )}
                {rule.status === 'running' && (
                  <p className={`text-xs ${muted}`}>
                    Si esta comprobación no termina, revisa Biwenger antes de crear otra puja.
                  </p>
                )}
                {rule.status === 'pending' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    disabled={busy}
                    onClick={() => cancel(rule.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </PageSection>
      {confirmation && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bid-confirm-title"
        >
          <div className={`${shell} w-full max-w-md space-y-4 p-6 shadow-2xl`}>
            <h2 id="bid-confirm-title" className="text-xl font-semibold">
              Confirmar {confirmation.kind === 'now' ? 'puja' : 'programación'}
            </h2>
            <p>{confirmation.summary}</p>
            <p className={`text-sm ${muted}`}>
              Cierre {selected && date(selected.closesAt)}.{' '}
              {confirmation.kind === 'schedule'
                ? 'La ejecución depende de que la oferta siga disponible y el contador pueda consultarse.'
                : 'Esta acción enviará la oferta a Biwenger ahora.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmation(null)} disabled={busy}>
                Volver
              </Button>
              <Button onClick={send} disabled={busy}>
                {busy ? 'Enviando…' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
