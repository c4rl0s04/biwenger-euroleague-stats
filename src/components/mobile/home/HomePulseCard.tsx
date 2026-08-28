import { Activity, CalendarClock, CircleAlert, TrendingDown, TrendingUp } from 'lucide-react';

import type { HomeSummary } from '@/lib/home/contracts';

const compactNumber = new Intl.NumberFormat('es-ES', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function roundLabel(summary: HomeSummary) {
  if (!summary.round.name) return 'Calendario pendiente';
  if (summary.round.status === 'live') return `${summary.round.name} · En directo`;
  if (summary.round.status === 'upcoming') return `${summary.round.name} · Próxima`;
  return summary.round.name;
}

export default function HomePulseCard({ summary }: { summary: HomeSummary }) {
  const alert = summary.alerts[0];
  const TrendIcon = summary.user.priceTrend < 0 ? TrendingDown : TrendingUp;

  return (
    <section className="mobile-home-pulse" aria-labelledby="home-pulse-title">
      <div className="mobile-home-pulse-heading">
        <span>
          <Activity size={15} aria-hidden="true" /> Tu pulso
        </span>
        <span className={`mobile-home-round-status mobile-home-round-${summary.round.status}`}>
          {summary.phase === 'preseason'
            ? 'Pretemporada'
            : summary.round.status === 'live'
              ? 'En directo'
              : 'Temporada'}
        </span>
      </div>
      <h2 id="home-pulse-title" className="sr-only">
        Resumen personal
      </h2>

      <div className="mobile-home-pulse-metrics">
        <div>
          <span>Posición</span>
          <strong>{summary.user.position ? `#${summary.user.position}` : '—'}</strong>
        </div>
        <div>
          <span>Puntos</span>
          <strong>{compactNumber.format(summary.user.totalPoints)}</strong>
        </div>
        <div>
          <span>Plantilla</span>
          <strong>{compactNumber.format(summary.user.teamValue)} €</strong>
        </div>
      </div>

      <div className="mobile-home-pulse-footer">
        <span className="mobile-home-round-copy">
          <CalendarClock size={15} aria-hidden="true" /> {roundLabel(summary)}
        </span>
        <span className={summary.user.priceTrend < 0 ? 'is-negative' : 'is-positive'}>
          <TrendIcon size={15} aria-hidden="true" />{' '}
          {compactNumber.format(Math.abs(summary.user.priceTrend))} €
        </span>
      </div>

      {alert && (
        <div className={`mobile-home-priority-alert is-${alert.severity}`}>
          <CircleAlert size={15} aria-hidden="true" />
          <span>{alert.message}</span>
        </div>
      )}
    </section>
  );
}
