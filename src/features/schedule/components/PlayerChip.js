import Link from 'next/link';
import { Avatar } from '@/components/ui/foundation';
import styles from './schedule-desktop.module.css';

/** @param {{player: import('../models/schedule').ScheduleMatchPlayer}} props */
export default function PlayerChip({ player }) {
  return (
    <Link href={`/player/${player.id}`} className={styles.chip}>
      <Avatar src={player.img} alt="" fallback={player.name?.charAt(0) || '?'} size="sm" />
      <span className={styles.playerIdentity}>
        <strong>{player.name || 'Jugador'}</strong>
        <small>
          {[player.position, player.team_code].filter(Boolean).join(' · ') || 'Tu jugador'}
        </small>
      </span>
    </Link>
  );
}
