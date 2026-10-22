'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { RoundCompleteViewModel } from '../models/round-read';

function useRoundRequest(url: string | null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    url: string | null;
    revision: number;
    data?: RoundCompleteViewModel;
    error?: boolean;
  }>({ url: null, revision: -1 });

  useEffect(() => {
    if (!url) return;
    let current = true;
    apiClient
      .get(url)
      .then((response) => {
        if (!current) return;
        if (response.success === false || !response.data) throw new Error('Round unavailable');
        setResult({ url, revision, data: response.data });
      })
      .catch(() => {
        if (current) setResult({ url, revision, error: true });
      });
    return () => {
      current = false;
    };
  }, [url, revision]);

  // State from the previous selection must never reach the new round's court.
  const matches = result.url === url && result.revision === revision;
  return {
    data: matches ? result.data : undefined,
    error: matches && result.error,
    loading: Boolean(url) && !matches,
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
