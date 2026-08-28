import Link from 'next/link';
import { Goal } from 'lucide-react';

import type { MatchSessionActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';

export default function MatchSessionActivityCard({ event }: { event: MatchSessionActivity }) {
  return (
    <article className="mobile-home-event mobile-home-event-match">
      <span className="mobile-home-event-icon">
        <Goal size={18} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card">
        <div className="mobile-home-event-meta">
          <span>Resultados · {event.roundName}</span>
          <ActivityTime value={event.occurredAt} />
        </div>
        <div className="mobile-home-score-list">
          {event.matches.map((match) => (
            <div key={match.id}>
              <span className={match.home.score > match.away.score ? 'is-winner' : ''}>
                {match.home.code ?? match.home.name}
                <strong>{match.home.score}</strong>
              </span>
              <span className={match.away.score > match.home.score ? 'is-winner' : ''}>
                {match.away.code ?? match.away.name}
                <strong>{match.away.score}</strong>
              </span>
            </div>
          ))}
        </div>
        <Link href={`/matches/round/${event.roundId}`} prefetch className="mobile-home-event-link">
          Todos los resultados <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
