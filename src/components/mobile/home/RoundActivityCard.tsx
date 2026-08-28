import Link from 'next/link';
import { Trophy } from 'lucide-react';

import type { RoundCompletedActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';

const money = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

export default function RoundActivityCard({ event }: { event: RoundCompletedActivity }) {
  const podium = event.participants.filter((participant) => participant.position <= 3);
  const winner = podium[0];

  return (
    <article className="mobile-home-event mobile-home-event-round">
      <span className="mobile-home-event-icon">
        <Trophy size={17} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card">
        <div className="mobile-home-event-meta">
          <span>Jornada fantasy</span>
          <ActivityTime value={event.occurredAt} />
        </div>
        <div className="mobile-home-event-title-row">
          <div>
            <strong>{event.roundName}</strong>
            <small>
              {winner ? `${winner.name} gana con ${winner.points} puntos` : 'Clasificación cerrada'}
            </small>
          </div>
          <span>{money.format(event.totalBonus)} €</span>
        </div>
        <ol className="mobile-home-podium" aria-label={`Podio de ${event.roundName}`}>
          {podium.map((participant) => (
            <li key={participant.userId}>
              <span>{participant.position}</span>
              <strong>{participant.name}</strong>
              <small>
                {participant.points} pts · +{money.format(participant.bonus)} €
              </small>
            </li>
          ))}
        </ol>
        <Link href={`/rounds/${event.roundId}/stats`} prefetch className="mobile-home-event-link">
          Abrir jornada <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
