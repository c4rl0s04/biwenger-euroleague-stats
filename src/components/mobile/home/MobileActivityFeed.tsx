'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';

import type { HomeActivityEvent, HomeActivityFilter, HomeFeedPage } from '@/lib/home/contracts';
import HomeActivityEventCard from './HomeActivityEventCard';
import { useMobileHomeActivity } from './MobileHomeActivityProvider';

interface Props {
  initialPage: HomeFeedPage | null;
  initialFilter: HomeActivityFilter;
  initialError?: string;
}

interface FeedSnapshot {
  items: HomeActivityEvent[];
  cursor: string | null;
  hasMore: boolean;
  error: string | null;
}

const emptyCopy: Record<HomeActivityFilter, string> = {
  all: 'Los fichajes, jornadas, porras y resultados aparecerán aquí en cuanto se produzcan.',
  transfers: 'Los fichajes aparecerán aquí en cuanto haya movimientos de mercado.',
  rounds: 'Las clasificaciones, primas y protagonistas aparecerán cuando finalice una jornada.',
  predictions: 'Las porras aparecerán cuando finalicen todos los partidos de la jornada.',
  results: 'Los marcadores aparecerán aquí cuando terminen los partidos.',
};

function snapshotFromPage(page: HomeFeedPage | null, error: string | null): FeedSnapshot {
  return {
    items: page?.items ?? [],
    cursor: page?.nextCursor ?? null,
    hasMore: page?.hasMore ?? false,
    error,
  };
}

export default function MobileActivityFeed({ initialPage, initialFilter, initialError }: Props) {
  const { filter } = useMobileHomeActivity();
  const initialSnapshot = snapshotFromPage(initialPage, initialError ?? null);
  const [items, setItems] = useState(initialPage?.items ?? []);
  const [cursor, setCursor] = useState(initialPage?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(initialPage?.hasMore ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? null);
  const [announcement, setAnnouncement] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const previousFilterRef = useRef<HomeActivityFilter>(initialFilter);
  const cacheRef = useRef(
    new Map<HomeActivityFilter, FeedSnapshot>([[initialFilter, initialSnapshot]])
  );

  const applySnapshot = useCallback((snapshot: FeedSnapshot) => {
    setItems(snapshot.items);
    setCursor(snapshot.cursor);
    setHasMore(snapshot.hasMore);
    setError(snapshot.error);
  }, []);

  const requestPage = useCallback(
    async (requestedFilter: HomeActivityFilter, requestedCursor: string | null) => {
      const query = new URLSearchParams({ type: requestedFilter });
      if (requestedCursor) query.set('cursor', requestedCursor);
      const response = await fetch(`/api/home/activity?${query}`, {
        signal: abortRef.current?.signal,
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 401) {
        window.location.assign('/login?callbackUrl=%2F');
        return null;
      }
      if (!response.ok) throw new Error('No se pudo cargar la actividad');
      return (await response.json()) as HomeFeedPage;
    },
    []
  );

  useEffect(() => {
    if (previousFilterRef.current === filter) return;
    previousFilterRef.current = filter;
    abortRef.current?.abort();
    inFlightRef.current = false;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const cached = cacheRef.current.get(filter);
    if (cached) {
      applySnapshot(cached);
      setLoading(false);
      setAnnouncement(`Filtro ${filter} restaurado`);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    inFlightRef.current = true;
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setError(null);
    setLoading(true);

    void requestPage(filter, null)
      .then((page) => {
        if (!page || controller.signal.aborted || requestId !== requestIdRef.current) return;
        const snapshot = snapshotFromPage(page, null);
        cacheRef.current.set(filter, snapshot);
        applySnapshot(snapshot);
        setAnnouncement(`${page.items.length} eventos cargados`);
      })
      .catch((loadError) => {
        if ((loadError as Error).name === 'AbortError') return;
        const snapshot = snapshotFromPage(null, 'No se pudo cargar esta categoría.');
        cacheRef.current.set(filter, snapshot);
        applySnapshot(snapshot);
        setAnnouncement('Error al cargar la categoría');
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setLoading(false);
          inFlightRef.current = false;
        }
      });
  }, [applySnapshot, filter, requestPage]);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || (!hasMore && !error)) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      const page = await requestPage(filter, cursor);
      if (!page || controller.signal.aborted || requestId !== requestIdRef.current) return;
      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        const nextItems = [...current, ...page.items.filter((item) => !known.has(item.id))];
        cacheRef.current.set(filter, {
          items: nextItems,
          cursor: page.nextCursor,
          hasMore: page.hasMore,
          error: null,
        });
        return nextItems;
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setAnnouncement(`${page.items.length} eventos nuevos cargados`);
    } catch (loadError) {
      if ((loadError as Error).name !== 'AbortError') {
        setError('No se pudo cargar más actividad.');
        setAnnouncement('Error al cargar más actividad');
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setLoading(false);
        inFlightRef.current = false;
      }
    }
  }, [cursor, error, filter, hasMore, requestPage]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || error || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: '220px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [error, hasMore, loadMore]);

  return (
    <section className="mobile-home-feed-section" aria-labelledby="activity-title">
      <div className="mobile-home-feed-heading">
        <div>
          <span>La liga, ahora</span>
          <h2 id="activity-title">Actividad reciente</h2>
        </div>
        <span className={`mobile-home-feed-live-state ${items.length > 0 ? 'is-live' : ''}`}>
          {items.length > 0 ? 'En vivo' : 'Sin estrenar'}
        </span>
      </div>

      {loading && items.length === 0 ? (
        <div className="mobile-home-filter-loading" aria-label="Cargando actividad filtrada">
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      ) : items.length > 0 ? (
        <div className="mobile-home-timeline">
          {items.map((event) => (
            <HomeActivityEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="mobile-home-feed-empty">
          <strong>Aún no hay movimientos en esta temporada</strong>
          <span>{emptyCopy[filter]}</span>
        </div>
      )}

      <div ref={sentinelRef} className="mobile-home-feed-sentinel" aria-hidden="true" />
      {(hasMore || error) && (
        <button
          type="button"
          className="mobile-home-load-more"
          onClick={() => void loadMore()}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw size={17} aria-hidden="true" />
          )}
          {loading ? 'Cargando…' : error ? 'Reintentar' : 'Cargar más'}
        </button>
      )}
      {!hasMore && items.length > 0 && (
        <p className="mobile-home-feed-end">Has llegado al inicio de la temporada.</p>
      )}
      {error && (
        <p className="mobile-home-feed-error" role="alert">
          {error}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
