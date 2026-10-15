import Image from 'next/image';
import Link from 'next/link';
import { MapPinned } from 'lucide-react';

import AutoAlignButton from './ScheduleLineupAction';
import type { UserSchedule, ScheduleRound, ScheduleMatch } from '../models/schedule';
import { formatMatchDate, formatMatchTime } from '@/lib/utils/date';

import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '@/components/mobile/MobileScreen';
import MobileSegmentedControl from '@/components/mobile/MobileSegmentedControl';

export default function MobileScheduleScreen({
  schedule,
  rounds,
  userName,
}: {
  schedule: UserSchedule;
  rounds: ScheduleRound[];
  userName?: string | null;
}) {
  const activeRoundId = schedule?.round?.round_id;
  const matches = schedule.matches ?? [];
  const players = schedule.userPlayers ?? matches.flatMap((match) => match.user_players);
  const days = new Map<string, ScheduleMatch[]>();
  for (const match of matches) {
    const date = match.date ? formatMatchDate(match.date) : 'Fecha por confirmar';
    const group = days.get(date) ?? [];
    group.push(match);
    days.set(date, group);
  }
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-has-sticky-action">
      <MobileScreenHeader eyebrow="Tu plantilla" title="Horario" />
      <div className="mobile-control-offset">
        <MobileSegmentedControl
          label="Seleccionar jornada"
          items={rounds.map((round) => ({
            label: String(round.round_name).replace('Jornada ', 'J'),
            href: `/schedule?roundId=${round.round_id}`,
            active: String(round.round_id) === String(activeRoundId),
          }))}
        />
      </div>
      {players.length > 0 && (
        <dl className="schedule-mobile-summary" aria-label="Resumen de la jornada">
          <div>
            <dt>Jugadores</dt>
            <dd>{players.length}</dd>
          </div>
          <div>
            <dt>Puntos</dt>
            <dd>{players.reduce((sum, player) => sum + (player.puntos ?? 0), 0)}</dd>
          </div>
        </dl>
      )}
      {!schedule.found ? (
        <p className="schedule-mobile-empty" role="status">
          {schedule.message || 'No hay jornada disponible.'}
        </p>
      ) : matches.length === 0 ? (
        <p className="schedule-mobile-empty" role="status">
          No hay partidos programados para esta fecha.
        </p>
      ) : (
        Array.from(days, ([date, dayMatches]) => (
          <section key={date} className="schedule-mobile-day" aria-label={date}>
            <MobileSectionHeading>{date}</MobileSectionHeading>
            <div className="grid gap-3">
              {dayMatches.map((match) => (
                <MobileScheduleMatch key={match.match_id} match={match} />
              ))}
            </div>
          </section>
        ))
      )}
      <MobileSectionHeading>Mapa</MobileSectionHeading>
      <MobileSectionLink
        href="/schedule/map"
        title="Mapa de la jornada"
        description="Sedes, trayectos y horarios"
        icon={MapPinned}
        accent="blue"
      />
      {schedule.found && schedule.matches?.length > 0 && (
        <div className="mobile-sticky-action-bar">
          <AutoAlignButton matches={schedule.matches} userName={userName} discrete />
        </div>
      )}
    </MobileScreen>
  );
}

function MobileScheduleMatch({ match }: { match: ScheduleMatch }) {
  const count = match.user_players.length;
  return (
    <article className={`schedule-mobile-match ${count ? 'schedule-mobile-match-active' : ''}`}>
      <div className="schedule-mobile-match-header">
        <time dateTime={match.date ?? undefined}>
          {formatMatchTime(match.date) || 'Por confirmar'}
        </time>
        <div className="schedule-mobile-teams">
          <Link href={`/team/${match.home_id}`}>
            {match.home_team || match.home_code || 'Local'}
          </Link>
          <Link href={`/team/${match.away_id}`}>
            {match.away_team || match.away_code || 'Visitante'}
          </Link>
        </div>
      </div>
      <p className="schedule-mobile-count">
        {count
          ? `${count} ${count === 1 ? 'jugador' : 'jugadores'} de tu plantilla`
          : 'Sin jugadores'}
      </p>
      {count > 0 && (
        <ul className="schedule-mobile-chips" aria-label="Tus jugadores">
          {match.user_players.map((player) => (
            <li key={player.id}>
              <Link href={`/player/${player.id}`} className="schedule-mobile-chip">
                <span className="schedule-mobile-avatar" style={{ borderColor: player.team_color }}>
                  {player.img ? (
                    <Image src={player.img} alt="" fill sizes="36px" />
                  ) : (
                    player.name?.charAt(0) || '?'
                  )}
                </span>
                <span className="schedule-mobile-player-copy">
                  <strong>{player.name || 'Jugador'}</strong>
                  <span>
                    {[player.position, player.team_code].filter(Boolean).join(' · ') ||
                      'Tu jugador'}
                  </span>
                </span>
                {player.puntos != null && (
                  <span className="schedule-mobile-points">{player.puntos} pts</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
