'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, Clock3, RefreshCw, Search } from 'lucide-react';
import { Button, PageCanvas, PageHeader, PageSection } from '@/components/ui/foundation';
import type { LiveMarketListing } from '../../live/models/live-bidding';
import type { PersonalBidWorkspace } from '../models/personal-bids';
import { BidCountCache } from '../lib/bid-count-cache';

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

type Confirmation = { summary: string } | null;

export function PersonalBidsScreen({ initialData }: { initialData: PersonalBidWorkspace }) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'deadline' | 'price'>('deadline');
  const [count, setCount] = useState<number | null>(null);
  const [countMessage, setCountMessage] = useState('');
  const [loadingCount, setLoadingCount] = useState(false);
  const [countObservedAt, setCountObservedAt] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy);
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countCache] = useState(
    () =>
      new BidCountCache(async (playerId) => {
        const response = await fetch(`/api/personal/bids/count?playerId=${playerId}`, {
          cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? 'No se pudo consultar el contador.');
        return result.totalBids;
      })
  );

  const selected = data.market.listings.find((item) => item.playerId === selectedId) ?? null;
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

  const loadCount = useCallback(
    (listing: LiveMarketListing, observedAt: string) => countCache.load(listing, observedAt),
    [countCache]
  );

  useEffect(() => {
    if (!selected) return;
    if (selected.isOwnListing) {
      setCount(null);
      setCountObservedAt(null);
      setCountMessage('Biwenger no muestra el contador de tus propios anuncios.');
      setLoadingCount(false);
      return;
    }
    let active = true;
    const cached = countCache.peek(selected, data.market.observedAt);
    setCount(cached?.totalBids ?? null);
    setCountObservedAt(cached?.fetchedAt ?? null);
    setCountMessage('');
    setLoadingCount(!cached || !countCache.isFresh(cached));
    void loadCount(selected, data.market.observedAt)
      .then((snapshot) => {
        if (!active) return;
        setCount(snapshot.totalBids);
        setCountObservedAt(snapshot.fetchedAt);
      })
      .catch((reason) => {
        if (!active) return;
        setCount(null);
        setCountObservedAt(null);
        setCountMessage(
          reason instanceof Error ? reason.message : 'No se pudo consultar el contador.'
        );
      })
      .finally(() => {
        if (active) setLoadingCount(false);
      });
    return () => {
      active = false;
    };
  }, [selected, data.market.observedAt, loadCount, countCache]);

  useEffect(() => {
    let active = true;
    const firstListings = data.market.listings.filter((item) => !item.isOwnListing).slice(0, 3);
    void (async () => {
      for (const listing of firstListings) {
        if (!active) break;
        try {
          await loadCount(listing, data.market.observedAt);
        } catch {
          // Stop warm-up after a denied or rate-limited request. Selection can retry explicitly.
          break;
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [data.market, loadCount]);

  useEffect(() => {
    if (selectedId === null) return;
    const index = filtered.findIndex((item) => item.playerId === selectedId);
    if (index < 0) return;
    const current = filtered[index];
    const neighbors = [filtered[index + 1], filtered[index - 1]].filter(
      (item): item is LiveMarketListing => Boolean(item && !item.isOwnListing)
    );
    let active = true;
    void (async () => {
      try {
        if (!current.isOwnListing) await loadCount(current, data.market.observedAt);
        for (const listing of neighbors) {
          if (!active) break;
          await loadCount(listing, data.market.observedAt);
        }
      } catch {
        // Prefetch failure is shown only when the user selects that player.
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedId, filtered, data.market.observedAt, loadCount]);

  useEffect(
    () => () => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    },
    []
  );

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
    const cached = countCache.peek(listing, data.market.observedAt);
    setSelectedId(listing.playerId);
    setCount(listing.isOwnListing ? null : (cached?.totalBids ?? null));
    setCountObservedAt(listing.isOwnListing ? null : (cached?.fetchedAt ?? null));
    setCountMessage(
      listing.isOwnListing ? 'Biwenger no muestra el contador de tus propios anuncios.' : ''
    );
    setLoadingCount(!listing.isOwnListing && (!cached || !countCache.isFresh(cached)));
    setAmount('');
    setConfirmation(null);
    setNotice('');
    setError('');
  }

  function prefetchCount(listing: LiveMarketListing) {
    if (listing.isOwnListing) return;
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      void loadCount(listing, data.market.observedAt).catch(() => undefined);
    }, 150);
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

  function prepare() {
    setError('');
    setNotice('');
    if (!selected || selected.isOwnListing || selected.ownWaitingOffers.length) return;
    const value = validateAmount(amount);
    if (value === null) return;
    setConfirmation({ summary: `${selected.playerName} · puja ahora ${euro(value)}` });
  }

  async function send() {
    if (!confirmation || !selected) return;
    const expectedListing = {
      sellerId: selected.sellerId,
      price: selected.price,
      closesAt: selected.closesAt,
    };
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/personal/bids/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selected.playerId,
          expectedListing,
          amount: Number(amount),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? 'No se pudo enviar la puja.');
      setNotice('Puja enviada. Comprueba la oferta en Biwenger.');
      setConfirmation(null);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageCanvas className="pb-2">
        <PageHeader title="Pujas privadas" description="Mercado en directo y pujas manuales." />
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
                      onMouseEnter={() => prefetchCount(listing)}
                      onFocus={() => prefetchCount(listing)}
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
                    <span className={muted}>Pujas</span>
                    <strong className="block" aria-live="polite">
                      {count !== null
                        ? count
                        : selected.isOwnListing
                          ? 'Tu anuncio'
                          : loadingCount
                            ? 'Consultando…'
                            : 'No disponible'}
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
                {countObservedAt !== null && (
                  <p className={`text-xs ${muted}`}>
                    Pujas consultadas a las{' '}
                    {new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }).format(
                      new Date(countObservedAt)
                    )}
                    {loadingCount ? ' · actualizando…' : ''}
                  </p>
                )}
                {(selected.isOwnListing || selected.ownWaitingOffers.length) && (
                  <p className="rounded-xl bg-[hsl(var(--surface-section-alternate))] p-3 text-sm">
                    {selected.isOwnListing
                      ? 'Este jugador es tuyo.'
                      : 'Tu puja actual prevalece. No se enviará otra.'}
                  </p>
                )}
                {!selected.isOwnListing && !selected.ownWaitingOffers.length && (
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
                        onClick={prepare}
                        disabled={busy || data.market.maximumBid < selected.price}
                      >
                        Preparar puja
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
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
              Confirmar puja
            </h2>
            <p>{confirmation.summary}</p>
            <p className={`text-sm ${muted}`}>
              Cierre {selected && date(selected.closesAt)}. Esta acción enviará la oferta a Biwenger
              ahora.
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
