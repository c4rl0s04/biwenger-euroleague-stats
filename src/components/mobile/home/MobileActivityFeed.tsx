'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';

import type { HomeActivityEvent, HomeFeedPage } from '@/lib/home/contracts';
import HomeActivityEventCard from './HomeActivityEventCard';

interface Props {
  initialPage: HomeFeedPage | null;
  initialError?: string;
}

export default function MobileActivityFeed({ initialPage, initialError }: Props) {
  const [items, setItems] = useState(initialPage?.items ?? []);
  const [cursor, setCursor] = useState(initialPage?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(initialPage?.hasMore ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? null);
  const [announcement, setAnnouncement] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || (!hasMore && !error)) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
      const response = await fetch(`/api/home/activity${query}`, {
        signal: controller.signal,
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 401) {
        window.location.assign('/login?callbackUrl=%2F');
        return;
      }
      if (!response.ok) throw new Error('No se pudo cargar la actividad');
      const page = (await response.json()) as HomeFeedPage;
      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !known.has(item.id))];
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
      if (!controller.signal.aborted) setLoading(false);
      inFlightRef.current = false;
    }
  }, [cursor, error, hasMore]);

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
        <span>{items.length > 0 ? 'En vivo' : 'Sin estrenar'}</span>
      </div>

      {items.length > 0 ? (
        <div className="mobile-home-timeline">
          {items.map((event) => (
            <HomeActivityEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="mobile-home-feed-empty">
          <strong>Aún no hay movimientos en esta temporada</strong>
          <span>
            Los fichajes, primas, jornadas y resultados aparecerán aquí en cuanto se produzcan.
          </span>
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
