'use client';

import { useApiData } from '@/lib/hooks/useApiData';

export default function NextRoundSubtitle() {
  const { data, loading } = useApiData('/api/dashboard/next-round');
  const nextRound = data?.nextRound;

  if (loading) {
    return (
      <span className="inline-block h-6 w-48 animate-pulse rounded bg-secondary align-text-bottom" />
    );
  }

  if (!nextRound) return null;

  const dateStr = new Date(nextRound.start_date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <span>
      {nextRound.round_name} • {dateStr}
    </span>
  );
}
