import Link from 'next/link';
import { Trophy } from 'lucide-react';

import type { RoundCompletedActivity } from '@/lib/home/contracts';
import { formatCompactMoney, formatExactPoints } from '@/lib/home/formatters';
import ActivityTime from './ActivityTime';
import HomeManagerAvatar from './HomeManagerAvatar';

export default function RoundActivityCard({ event }: { event: RoundCompletedActivity }) {
  const participants = [...event.participants].sort(
    (left, right) => left.position - right.position || right.points - left.points
  );
  const winner = participants[0];

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
          <span>{formatCompactMoney(event.totalBonus)}</span>
        </div>
        <ol className="mobile-home-podium" aria-label={`Clasificación de ${event.roundName}`}>
          {participants.map((participant) => (
            <li key={participant.userId}>
              <span>{participant.position}</span>
              <HomeManagerAvatar
                name={participant.name}
                icon={participant.icon}
                colorIndex={participant.colorIndex}
              />
              <strong>{participant.name}</strong>
              <small>
                {formatExactPoints(participant.points)} ·{' '}
                {participant.bonus > 0 ? formatCompactMoney(participant.bonus) : 'Sin prima'}
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
