'use client';

import { useViewerTimeZone } from '@/lib/hooks/useViewerTimeZone';
import {
  formatEventInstant,
  SERVER_EVENT_TIME_ZONE,
  type EventTimeFormat,
} from '@/lib/utils/event-time';

export default function EventTime({
  value,
  format = 'time',
  fallback = '',
  serverLabel,
  className,
}: {
  value: string | null | undefined;
  format?: EventTimeFormat;
  fallback?: string;
  serverLabel?: string | null;
  className?: string;
}) {
  const timeZone = useViewerTimeZone();
  // Reuse the server-provided label while hydrating to avoid differences between ICU versions.
  const label = timeZone
    ? formatEventInstant(value, timeZone, format)
    : (serverLabel ?? formatEventInstant(value, null, format));

  if (!label) return <span className={className}>{fallback}</span>;

  const description = timeZone ? formatEventInstant(value, timeZone, 'absolute') : undefined;
  return (
    <time dateTime={value ?? undefined} className={className} title={description}>
      {label}
      <span className="sr-only">{` (${timeZone ?? SERVER_EVENT_TIME_ZONE})`}</span>
    </time>
  );
}
