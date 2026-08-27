'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

import MobileRecordList from '../MobileRecordList';

export default function MobileOffersClient() {
  const [offers, setOffers] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .get('/api/users/lineup')
      .then((response) => active && setOffers(response.success ? response.data?.offers ?? [] : []))
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
  return <MobileRecordList data={offers} emptyMessage="No tienes ofertas pendientes." />;
}
