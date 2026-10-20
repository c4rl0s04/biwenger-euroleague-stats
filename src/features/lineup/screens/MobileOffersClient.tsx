'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

import type { SafeLineupOffer } from '../models/lineup';
import MobileRecordList from '@/components/mobile/MobileRecordList';

export default function MobileOffersClient() {
  const [offers, setOffers] = useState<SafeLineupOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .get('/api/users/lineup')
      .then(
        (response) => active && setOffers(response.success ? (response.data?.offers ?? []) : [])
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mobile-lineup-loading">
        <LoaderCircle className="animate-spin" aria-hidden="true" /> Cargando ofertas
      </div>
    );
  }
  return (
    <MobileRecordList
      rows={offers.slice(0, 20).map((offer, index) => ({
        key: String(offer.id ?? index),
        title: `Registro ${index + 1}`,
      }))}
      emptyMessage="No tienes ofertas pendientes."
    />
  );
}
