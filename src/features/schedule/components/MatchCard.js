import Link from 'next/link';
import PlayerImage from '@/components/ui/PlayerImage';
import { formatMatchTime } from '@/lib/utils/date';
import PlayerChip from './PlayerChip';
import styles from './schedule-desktop.module.css';

/** @param {{match: import('../models/schedule').ScheduleMatch}} props */
export default function MatchCard({ match }) {
  const count = match.user_players.length;
  return (
    <article className={styles.match} data-has-players={count > 0}>
      <time dateTime={match.date ?? undefined} className={styles.time}>
        {formatMatchTime(match.date) || 'Por confirmar'}
      </time>
      <div className={styles.teams}>
        {[
          { id: match.home_id, name: match.home_team, fallback: 'Local' },
          { id: match.away_id, name: match.away_team, fallback: 'Visitante' },
        ].map((team) => (
          <Link key={team.fallback} href={`/team/${team.id}`} className={styles.team}>
            {team.id != null && (
              <span className={styles.teamLogo} aria-hidden="true">
                <PlayerImage
                  src={`https://cdn.biwenger.com/i/t/${team.id}.png`}
                  alt={team.name || team.fallback}
                  width={24}
                  height={24}
                  hideFallback
                />
              </span>
            )}
            <span>{team.name || team.fallback}</span>
          </Link>
        ))}
      </div>
      <div className={styles.matchPlayers}>
        <span className={styles.playerCount}>
          {count
            ? `${count} ${count === 1 ? 'jugador de tu plantilla' : 'jugadores de tu plantilla'}`
            : 'Sin jugadores'}
        </span>
        {count > 0 && (
          <ul className={styles.chips} aria-label="Tus jugadores">
            {match.user_players.map((player) => (
              <li key={player.id}>
                <PlayerChip player={player} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
