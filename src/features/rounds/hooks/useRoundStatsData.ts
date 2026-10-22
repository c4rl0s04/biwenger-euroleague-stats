'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { RoundCompleteViewModel } from '../models/round-read';

function useRoundRequest(url: string | null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    url: string | null;
    data?: RoundCompleteViewModel;
    error?: boolean;
    loading: boolean;
  }>({ url: null, loading: false });

  useEffect(() => {
    if (!url) return;
    let current = true;
    setResult({ url, loading: true });
    apiClient
      .get(url)
      .then((response) => {
        if (!current) return;
        if (response.success === false || !response.data) throw new Error('Round unavailable');
        setResult({ url, data: response.data, loading: false });
      })
      .catch(() => {
        if (current) setResult({ url, error: true, loading: false });
      });
    return () => {
      current = false;
    };
  }, [url, revision]);

  // State from the previous selection must never reach the new round's court.
  return {
    data: result.url === url ? result.data : undefined,
    error: result.url === url && result.error,
    loading: Boolean(url) && (result.url !== url || result.loading),
    retry: () => setRevision((value) => value + 1),
  };
}

export function useRoundStatsData(
  roundId: string | number | null,
  userId: string | number | null,
  background: boolean
) {
  const quick = useRoundRequest(
    roundId && userId ? `/api/rounds/stats?roundId=${roundId}&userId=${userId}&mode=quick` : null
  );
  const full = useRoundRequest(
    roundId && background ? `/api/rounds/stats?roundId=${roundId}&mode=full` : null
  );
  return { quick, full };
}
