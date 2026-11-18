'use client';

import { useViewerTimeZone } from '@/lib/hooks/useViewerTimeZone';
import { formatEventInstant, type EventTimeFormat } from '@/lib/utils/event-time';

export default function EventTime({
  value,
  format = 'time',
  fallback = '',
  className,
}: {
  value: string | null | undefined;
  format?: EventTimeFormat;
  fallback?: string;
  className?: string;
}) {
  const timeZone = useViewerTimeZone();
  const label = formatEventInstant(value, timeZone, format);

  if (!label) return <span className={className}>{fallback}</span>;

  const description = formatEventInstant(value, timeZone, 'absolute');
  return (
    <time dateTime={value ?? undefined} className={className} title={description}>
      {label}
      <span className="sr-only">{` (${timeZone})`}</span>
    </time>
  );
}
