import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';

import type { TransferActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';

const money = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export default function TransferActivityCard({ event }: { event: TransferActivity }) {
  return (
    <article className="mobile-home-event mobile-home-event-transfer">
      <span className="mobile-home-event-icon">
        <ArrowRightLeft size={17} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card">
        <div className="mobile-home-event-meta">
          <span>Fichaje</span>
          <ActivityTime value={event.occurredAt} />
        </div>
        <Link href={`/player/${event.player.id}`} prefetch className="mobile-home-transfer-player">
          <span className="mobile-home-player-mark">
            {event.player.teamCode ?? event.player.name.slice(0, 2)}
          </span>
          <span>
            <strong>{event.player.name}</strong>
            <small>
              {event.player.position ?? 'Jugador'} · {money.format(event.amount)}
            </small>
          </span>
        </Link>
        <p>
          <strong>{event.buyer.name}</strong> incorpora al jugador{' '}
          {event.seller.name !== 'Mercado' ? (
            <>
              desde <strong>{event.seller.name}</strong>
            </>
          ) : (
            <>desde el mercado</>
          )}
          .
        </p>
        <Link href="/market/transfers" className="mobile-home-event-link">
          Ver mercado <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
