import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import type { RoundHighlightActivity, RoundHighlightPlayer } from '@/lib/home/contracts';
import { formatExactPoints } from '@/lib/home/formatters';
import ActivityTime from './ActivityTime';

function roleLabel(player: RoundHighlightPlayer) {
  if (player.isCaptain) return 'Capitán';
  if (player.role === '6th_man') return 'Sexto hombre';
  if (player.role === 'titular') return 'Titular';
  return 'Banquillo';
}

function PlayerPortrait({ player }: { player: RoundHighlightPlayer }) {
  return (
    <span className="mobile-home-highlight-portrait">
      {player.image ? (
        <Image src={player.image} alt="" fill sizes="64px" />
      ) : (
        <span>{player.teamName ?? player.name.slice(0, 3).toUpperCase()}</span>
      )}
    </span>
  );
}

export default function RoundHighlightActivityCard({ event }: { event: RoundHighlightActivity }) {
  const starters = event.idealLineup.filter((player) => player.role === 'titular');

  return (
    <article className="mobile-home-event mobile-home-event-highlight">
      <span className="mobile-home-event-icon">
        <Sparkles size={17} aria-hidden="true" />
      </span>
      <div className="mobile-home-event-card mobile-home-highlight-card">
        <div className="mobile-home-event-meta">
          <span>Protagonistas · {event.roundName}</span>
          <ActivityTime value={event.occurredAt} />
        </div>

        <div className="mobile-home-highlight-heading">
          <div>
            <strong>{event.mvps.length > 1 ? 'MVP compartido' : 'MVP de la jornada'}</strong>
            <small>{event.mvps.map((player) => player.name).join(' · ')}</small>
          </div>
          <span>{formatExactPoints(event.mvps[0]?.points ?? 0)}</span>
        </div>

        <div className="mobile-home-highlight-mvps">
          {event.mvps.map((player) => (
            <Link key={player.id} href={`/player/${player.id}`} prefetch>
              <PlayerPortrait player={player} />
              <span>
                <strong>{player.name}</strong>
                <small>
                  {player.position ?? 'Jugador'} · {player.teamName ?? 'Sin equipo'}
                </small>
              </span>
            </Link>
          ))}
        </div>

        <div
          className="mobile-home-highlight-preview"
          aria-label="Cinco titulares del equipo ideal"
        >
          <span>Equipo ideal</span>
          <div>
            {starters.map((player) => (
              <Link key={player.id} href={`/player/${player.id}`} aria-label={player.name} prefetch>
                <PlayerPortrait player={player} />
                {player.isCaptain && <b aria-label="Capitán">C</b>}
              </Link>
            ))}
          </div>
        </div>

        <details className="mobile-home-highlight-details">
          <summary>
            Ver equipo ideal <span>{formatExactPoints(event.totalPoints)}</span>
          </summary>
          <ol>
            {event.idealLineup.map((player) => (
              <li key={player.id}>
                <PlayerPortrait player={player} />
                <span>
                  <strong>{player.name}</strong>
                  <small>{roleLabel(player)}</small>
                </span>
                <span>
                  <b>{formatExactPoints(player.points)}</b>
                  <small>×{player.multiplier.toLocaleString('es-ES')}</small>
                </span>
              </li>
            ))}
          </ol>
        </details>

        <Link href={`/rounds/${event.roundId}/stats`} prefetch className="mobile-home-event-link">
          Abrir protagonistas <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
