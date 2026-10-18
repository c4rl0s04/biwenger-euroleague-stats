import Link from 'next/link';
import { MapPinned } from 'lucide-react';
import ScheduleControls from './ScheduleControls';
import MatchCard from './MatchCard';
import RoundSummary from './RoundSummary';
import ScheduleLineupAction from './ScheduleLineupAction';
import Section from '@/components/layout/Section';
import { PageCanvas, PageHeader, EmptyState } from '@/components/ui/foundation';
import { formatMatchDate } from '@/lib/utils/date';
import styles from './schedule-desktop.module.css';

/** @param {{model: import('../models/schedule').ScheduleScreenModel}} props */
export default function DesktopScheduleScreen({ model: { schedule, users, rounds, userId } }) {
  const matches = schedule.found ? schedule.matches : [];
  const groupedMatches = matches.reduce((groups, match) => {
    const day = match.date ? formatMatchDate(match.date) : 'Fecha por confirmar';
    (groups[day] ??= []).push(match);
    return groups;
  }, {});
  const manager = users.find((user) => String(user.id) === String(userId));
  const players = schedule.userPlayers ?? matches.flatMap((match) => match.user_players);

  return (
    <div className={styles.screen} data-schedule-desktop>
      <PageCanvas className={styles.canvas}>
        <PageHeader
          title="Horario Jugadores"
          description="Organiza tu plantilla por horario de partido."
        />
        <div className={styles.toolbar}>
          <ScheduleControls
            users={users}
            rounds={rounds}
            activeUserId={userId}
            activeRoundId={schedule.found ? schedule.round.round_id : null}
          />
          <div className={styles.toolbarSummary}>
            <RoundSummary players={players} />
            <Link
              href={`/matches${schedule.found && schedule.round.round_id != null ? `?roundId=${schedule.round.round_id}` : ''}#mapa-de-sedes`}
              className={styles.mapLink}
            >
              <MapPinned size={18} aria-hidden="true" />
              Mapa
            </Link>
          </div>
        </div>
        {schedule.found && matches.length > 0 && (
          <ScheduleLineupAction
            key={`${userId}-${schedule.round.round_id}`}
            matches={matches}
            userName={manager?.name}
            desktop
          />
        )}
      </PageCanvas>
      {schedule.found ? (
        Object.entries(groupedMatches).length ? (
          Object.entries(groupedMatches).map(([day, dayMatches]) => (
            <Section key={day} title={day} className={styles.daySection}>
              <div className={styles.matchList}>
                {dayMatches.map((match) => (
                  <MatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </Section>
          ))
        ) : (
          <div className={styles.empty}>
            <EmptyState role="status">No hay partidos programados para esta fecha.</EmptyState>
          </div>
        )
      ) : (
        <div className={styles.empty}>
          <EmptyState role="status">
            {schedule.message || 'Selecciona una jornada para ver los partidos.'}
          </EmptyState>
        </div>
      )}
    </div>
  );
}
