import { BadgeEuro } from 'lucide-react';

import type { AdminBonusActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';

const money = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export default function AdminBonusActivityCard({ event }: { event: AdminBonusActivity }) {
  return (
    <article className="mobile-home-event mobile-home-event-bonus">
      <span className="mobile-home-event-icon">
        <BadgeEuro size={18} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card">
        <div className="mobile-home-event-meta">
          <span>Prima</span>
          <ActivityTime value={event.occurredAt} />
        </div>
        <div className="mobile-home-event-title-row">
          <div>
            <strong>{event.recipient.name}</strong>
            <small>{event.description}</small>
          </div>
          <span>+{money.format(event.amount)}</span>
        </div>
      </div>
    </article>
  );
}
