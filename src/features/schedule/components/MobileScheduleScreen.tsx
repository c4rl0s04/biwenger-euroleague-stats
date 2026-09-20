import { MapPinned, Sparkles } from 'lucide-react';

import AutoAlignButton from './ScheduleLineupAction';
import type { UserSchedule, ScheduleRound } from '../models/schedule';
import { MobileMatchRow } from '@/features/matches/public';

import {
  MobileListRow,
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
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-has-sticky-action">
      <MobileScreenHeader
        eyebrow="Tu plantilla"
        title="Horario"
        description={schedule?.round?.round_name ?? 'Selecciona jornada'}
      />
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
      <MobileSectionHeading>Cronología</MobileSectionHeading>
      <div className="mobile-schedule-timeline">
        {(schedule.matches ?? []).map((match) => (
          <section key={String(match.match_id)}>
            <MobileMatchRow match={match.listItem} />
            <div className="mobile-schedule-players">
              {(match.user_players ?? []).map((player) => (
                <MobileListRow
                  key={String(player.id)}
                  href={`/player/${player.id}`}
                  title={player.name}
                  subtitle={player.position ?? 'Tu jugador'}
                  trailing={player.puntos != null ? `${player.puntos} pts` : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
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
