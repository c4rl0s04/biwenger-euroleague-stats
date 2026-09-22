'use client';

const absoluteFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Madrid',
});

function relativeLabel(value: string) {
  const elapsedMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, 'minute');
  const hours = Math.round(elapsedMinutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

export default function ActivityTime({ value }: { value: string }) {
  const absolute = absoluteFormatter.format(new Date(value));

  return (
    <time dateTime={value} title={absolute} aria-label={absolute} suppressHydrationWarning>
      {relativeLabel(value)}
    </time>
  );
}
