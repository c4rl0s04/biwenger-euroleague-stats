'use client';

import { useViewerTimeZone } from '@/lib/hooks/useViewerTimeZone';
import { formatEventInstant } from '@/lib/utils/event-time';

function relativeLabel(value: string) {
  const elapsedMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, 'minute');
  const hours = Math.round(elapsedMinutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

export default function ActivityTime({ value }: { value: string }) {
  const timeZone = useViewerTimeZone();
  const absolute = formatEventInstant(value, timeZone, 'absolute');

  return (
    <time
      dateTime={value}
      title={absolute}
      aria-label={absolute ? `${absolute} (${timeZone})` : undefined}
      suppressHydrationWarning
    >
      {relativeLabel(value)}
    </time>
  );
}
