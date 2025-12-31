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

  const startDate = new Date(nextRound.start_date);
  const now = new Date();
  const hasStarted = now > startDate;

  const dateStr = startDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <span className="flex items-center gap-2">
      <span>
        {nextRound.round_name} • {dateStr}
      </span>
      {hasStarted && (
        <span className="px-2 py-0.5 text-xs font-bold bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
          En juego
        </span>
      )}
    </span>
  );
}
