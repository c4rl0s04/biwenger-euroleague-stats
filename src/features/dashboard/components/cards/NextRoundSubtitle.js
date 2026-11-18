'use client';

import EventTime from '@/components/ui/EventTime';
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

  return (
    <span className="flex items-center gap-2">
      <span>
        {nextRound.round_name} • <EventTime value={nextRound.start_date} format="fullDateTime" />
      </span>
      {hasStarted && (
        <span className="px-3 py-1 text-sm font-bold bg-green-500/10 text-green-500 rounded-full border border-green-500/20 ml-2">
          En juego
        </span>
      )}
    </span>
  );
}
