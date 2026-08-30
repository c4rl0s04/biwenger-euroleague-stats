import Link from 'next/link';
import { Medal } from 'lucide-react';

import type { TournamentRoundActivity } from '@/lib/home/contracts';
import ActivityTime from './ActivityTime';
import HomeManagerAvatar from './HomeManagerAvatar';

export default function TournamentRoundActivityCard({ event }: { event: TournamentRoundActivity }) {
  return (
    <article className="mobile-home-event mobile-home-event-tournament">
      <span className="mobile-home-event-icon">
        <Medal size={17} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card mobile-home-tournament-card">
        <div className="mobile-home-event-meta">
          <span>Torneo · {event.roundName}</span>
          <ActivityTime value={event.occurredAt} />
        </div>

        <div className="mobile-home-tournament-heading">
          <strong>{event.tournamentName}</strong>
          <small>
            {event.fixtures.length} enfrentamiento{event.fixtures.length === 1 ? '' : 's'}
          </small>
        </div>

        {event.champion && (
          <Link
            href={`/user/${event.champion.id}`}
            className="mobile-home-tournament-champion"
            prefetch
          >
            <HomeManagerAvatar
              name={event.champion.name}
              icon={event.champion.icon}
              colorIndex={event.champion.colorIndex}
              size="medium"
            />
            <span>
              <small>Campeón</small>
              <strong>{event.champion.name}</strong>
            </span>
            <Medal size={22} aria-hidden="true" />
          </Link>
        )}

        <ul
          className="mobile-home-tournament-fixtures"
          aria-label={`${event.tournamentName}, ${event.roundName}`}
        >
          {event.fixtures.map((fixture) => {
            const homeWon = fixture.home.score > fixture.away.score;
            const awayWon = fixture.away.score > fixture.home.score;
            return (
              <li key={fixture.id}>
                <Link
                  href={`/user/${fixture.home.id}`}
                  className={homeWon ? 'is-winner' : undefined}
                  prefetch
                >
                  <HomeManagerAvatar
                    name={fixture.home.name}
                    icon={fixture.home.icon}
                    colorIndex={fixture.home.colorIndex}
                  />
                  <span>{fixture.home.name}</span>
                  <strong>{fixture.home.score}</strong>
                </Link>
                <Link
                  href={`/user/${fixture.away.id}`}
                  className={awayWon ? 'is-winner' : undefined}
                  prefetch
                >
                  <HomeManagerAvatar
                    name={fixture.away.name}
                    icon={fixture.away.icon}
                    colorIndex={fixture.away.colorIndex}
                  />
                  <span>{fixture.away.name}</span>
                  <strong>{fixture.away.score}</strong>
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href={`/tournaments/${event.tournamentId}/results`}
          prefetch
          className="mobile-home-event-link"
        >
          Abrir resultados del torneo <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
