'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, IconButton } from '@/components/ui/foundation';
import styles from './schedule-desktop.module.css';

/** @param {{users: import('@/features/managers/public').ManagerDirectoryViewModel[], activeUserId?: string, activeRoundId: number | null, rounds: import('../models/schedule').ScheduleRound[]}} props */
export default function ScheduleControls({ users, activeUserId, activeRoundId, rounds }) {
  const router = useRouter();
  const manager = users.find((user) => String(user.id) === String(activeUserId));
  const index = rounds.findIndex((round) => String(round.round_id) === String(activeRoundId));
  const changeRound = (id) => router.push(`/schedule?roundId=${id}`);

  return (
    <div className={styles.controls}>
      <div className={styles.manager}>
        <Avatar alt="" fallback={manager?.name?.charAt(0) || '?'} size="sm" />
        <span>{manager?.name || 'Tu plantilla'}</span>
      </div>
      <div className={styles.roundPicker}>
        <IconButton
          variant="ghost"
          aria-label="Jornada anterior"
          disabled={index <= 0}
          onClick={() => changeRound(rounds[index - 1].round_id)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </IconButton>
        <label className={styles.roundLabel}>
          <span className="sr-only">Seleccionar jornada</span>
          <select
            value={activeRoundId ?? ''}
            onChange={(event) => changeRound(event.target.value)}
            disabled={!rounds.length}
          >
            {index < 0 && <option value="">Selecciona jornada</option>}
            {rounds.map((round) => (
              <option key={round.round_id} value={round.round_id ?? ''}>
                {round.round_name}
              </option>
            ))}
          </select>
        </label>
        <IconButton
          variant="ghost"
          aria-label="Jornada siguiente"
          disabled={index < 0 || index >= rounds.length - 1}
          onClick={() => changeRound(rounds[index + 1].round_id)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
