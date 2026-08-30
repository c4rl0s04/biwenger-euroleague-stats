import Link from 'next/link';
import { Trophy } from 'lucide-react';

import type { RoundCompletedActivity } from '@/lib/home/contracts';
import { formatCompactMoney, formatExactPoints } from '@/lib/home/formatters';
import ActivityTime from './ActivityTime';
import HomeManagerAvatar from './HomeManagerAvatar';
import HomeRankBadge from './HomeRankBadge';

export default function RoundActivityCard({ event }: { event: RoundCompletedActivity }) {
  const participants = [...event.participants].sort(
    (left, right) => left.position - right.position || right.points - left.points
  );
  const winners = participants.filter((participant) => participant.position === 1);
  const lastPosition = Math.max(...participants.map((participant) => participant.position));

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
              {winners.length > 1
                ? `Victoria compartida: ${winners.map((winner) => winner.name).join(' · ')}`
                : winners[0]
                  ? `${winners[0].name} gana con ${winners[0].points} puntos`
                  : 'Clasificación cerrada'}
            </small>
          </div>
          <span className="mobile-home-round-total">
            <small>Repartido</small>
            <strong>{formatCompactMoney(event.totalBonus)}</strong>
          </span>
        </div>
        <ol className="mobile-home-podium" aria-label={`Clasificación de ${event.roundName}`}>
          {participants.map((participant) => (
            <li key={participant.userId}>
              <HomeRankBadge
                position={participant.position}
                isLast={participant.position === lastPosition && participant.position > 3}
              />
              <HomeManagerAvatar
                name={participant.name}
                icon={participant.icon}
                colorIndex={participant.colorIndex}
              />
              <strong className="mobile-home-round-manager">{participant.name}</strong>
              <div className="mobile-home-round-metrics">
                <span>
                  <small>Puntos</small>
                  <strong>{formatExactPoints(participant.points)}</strong>
                </span>
                <span>
                  <small>Prima</small>
                  <strong>
                    {participant.bonus > 0 ? formatCompactMoney(participant.bonus) : 'Sin prima'}
                  </strong>
                </span>
              </div>
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
