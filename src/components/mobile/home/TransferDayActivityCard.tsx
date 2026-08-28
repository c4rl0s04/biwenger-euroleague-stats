import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';

import type { TransferDayActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';
import TransferCarousel from './TransferCarousel';

const dayFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Madrid',
});

export default function TransferDayActivityCard({ event }: { event: TransferDayActivity }) {
  const date = new Date(`${event.date}T12:00:00+02:00`);
  const movements = event.transfers.length;

  return (
    <article className="mobile-home-event mobile-home-event-transfer-day">
      <span className="mobile-home-event-icon">
        <ArrowRightLeft size={17} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card mobile-home-transfer-day-card">
        <div className="mobile-home-event-meta">
          <span>Fichajes · {dayFormatter.format(date)}</span>
          <ActivityTime value={event.occurredAt} />
        </div>
        <div className="mobile-home-transfer-day-heading">
          <div>
            <strong>
              {movements} {movements === 1 ? 'movimiento' : 'movimientos'}
            </strong>
            <small>Desliza para recorrer el mercado</small>
          </div>
          <Link href="/market/transfers" prefetch>
            Mercado <span aria-hidden="true">→</span>
          </Link>
        </div>
        <TransferCarousel transfers={event.transfers} />
      </div>
    </article>
  );
}
