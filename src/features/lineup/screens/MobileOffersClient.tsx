'use client';

import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { MobileListRow } from '@/components/mobile/MobileScreen';
import { EmptyState } from '@/components/ui/compositions/EmptyState';
import { Button } from '@/components/ui/primitives/Button';
import EventTime from '@/components/ui/EventTime';

import { formatCurrency } from '../logic/format';
import type { SafeLineupOffer } from '../models/lineup';

type OffersState =
  { status: 'loading' | 'error' | 'reconnect' } | { status: 'ready'; offers: SafeLineupOffer[] };

export default function MobileOffersClient() {
  const [state, setState] = useState<OffersState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    apiClient
      .get('/api/users/lineup')
      .then((response) => {
        if (!active) return;
        setState(
          response.success && Array.isArray(response.data?.offers)
            ? { status: 'ready', offers: response.data.offers }
            : { status: 'error' }
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        const reconnect = error instanceof ApiError && error.code === 'BIWENGER_RECONNECT_REQUIRED';
        setState({ status: reconnect ? 'reconnect' : 'error' });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  if (state.status === 'loading') {
    return (
      <div className="mobile-lineup-loading" role="status">
        <LoaderCircle className="animate-spin" aria-hidden="true" /> Cargando ofertas
      </div>
    );
  }

  if (state.status !== 'ready') {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border-default bg-surface-card p-3 text-sm">
        {state.status === 'reconnect' ? (
          <>
            <p role="alert">Renueva tu conexión para consultar las ofertas.</p>
            <Link href="/settings/biwenger" className="underline">
              Renovar conexión con Biwenger
            </Link>
          </>
        ) : (
          <>
            <p role="alert">No se pudieron cargar las ofertas.</p>
            <Button
              onClick={() => {
                setState({ status: 'loading' });
                setAttempt((value) => value + 1);
              }}
            >
              Reintentar
            </Button>
          </>
        )}
      </div>
    );
  }

  if (state.offers.length === 0) {
    return <EmptyState>No tienes ofertas pendientes.</EmptyState>;
  }

  return (
    <div>
      {state.offers.slice(0, 20).map((offer, index) => (
        <MobileListRow
          key={offer.id ?? index}
          title={
            offer.amount === undefined ? 'Importe no disponible' : formatCurrency(offer.amount)
          }
          subtitle={
            <>
              Vence:{' '}
              <EventTime
                value={offer.until === undefined ? null : new Date(offer.until * 1000).toJSON()}
                format="deadline"
                fallback="fecha no disponible"
              />
            </>
          }
        />
      ))}
    </div>
  );
}
