import { MapPinned, Sparkles } from 'lucide-react';

import AutoAlignButton from '@/components/schedule/AutoAlignButton';
import { MobileMatchRow, type MatchListItemViewModel } from '@/features/matches/public';

import {
  MobileListRow,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';
import MobileSegmentedControl from '../MobileSegmentedControl';

type RecordValue = Record<string, any>;

function toMatchListItem(match: RecordValue): MatchListItemViewModel {
  const date = match.date ? new Date(match.date) : null;
  return {
    id: Number(match.match_id ?? match.id),
    date: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
    status: typeof match.status === 'string' ? match.status : null,
    home: {
      id: Number(match.home_id),
      name: String(match.home_team ?? 'Local'),
      score: typeof match.home_score === 'number' ? match.home_score : null,
    },
    away: {
      id: Number(match.away_id),
      name: String(match.away_team ?? 'Visitante'),
      score: typeof match.away_score === 'number' ? match.away_score : null,
    },
  };
}

export default function MobileScheduleScreen({
  schedule,
  rounds,
  userName,
}: {
  schedule: RecordValue;
  rounds: RecordValue[];
  userName?: string;
}) {
  const activeRoundId = schedule?.round?.round_id;
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-has-sticky-action">
      <MobileScreenHeader eyebrow="Tu plantilla" title="Horario" description={schedule?.round?.round_name ?? 'Selecciona jornada'} />
      <div className="mobile-control-offset">
        <MobileSegmentedControl label="Seleccionar jornada" items={rounds.map((round) => ({ label: String(round.round_name).replace('Jornada ', 'J'), href: `/schedule?roundId=${round.round_id}`, active: String(round.round_id) === String(activeRoundId) }))} />
      </div>
      <MobileSectionHeading>Cronología</MobileSectionHeading>
      <div className="mobile-schedule-timeline">
        {(schedule.matches ?? []).map((match: RecordValue) => (
          <section key={String(match.match_id ?? match.id)}>
            <MobileMatchRow match={toMatchListItem(match)} />
            <div className="mobile-schedule-players">
              {(match.user_players ?? []).map((player: RecordValue) => (
                <MobileListRow key={String(player.player_id ?? player.id)} href={`/player/${player.player_id ?? player.id}`} title={player.name} subtitle={player.position ?? 'Tu jugador'} trailing={player.puntos != null ? `${player.puntos} pts` : undefined} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <MobileSectionHeading>Mapa</MobileSectionHeading>
      <MobileSectionLink href="/schedule/map" title="Mapa de la jornada" description="Sedes, trayectos y horarios" icon={MapPinned} accent="blue" />
      {schedule.found && schedule.matches?.length > 0 && (
        <div className="mobile-sticky-action-bar">
          <AutoAlignButton matches={schedule.matches} userName={userName} discrete />
        </div>
      )}
    </MobileScreen>
  );
}
