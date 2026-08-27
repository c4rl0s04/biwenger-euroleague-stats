import { MapPinned } from 'lucide-react';

import MobileMatchRow from '../MobileMatchRow';
import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';
import MobileSegmentedControl from '../MobileSegmentedControl';

type Round = Record<string, any>;

export default function MobileMatchesScreen({ rounds, activeRoundId }: { rounds: Round[]; activeRoundId: string | number }) {
  const activeRound = rounds.find((round) => String(round.round_id) === String(activeRoundId)) ?? rounds[0];
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Euroleague" title="Partidos" description={activeRound?.round_name ?? 'Calendario'} />
      <div className="mobile-control-offset">
        <MobileSegmentedControl
          label="Seleccionar jornada"
          items={rounds.map((round) => ({ label: String(round.round_name).replace('Jornada ', 'J'), href: `/matches?roundId=${round.round_id}`, active: String(round.round_id) === String(activeRound?.round_id) }))}
        />
      </div>
      <MobileSectionHeading>{activeRound?.round_name ?? 'Jornada'}</MobileSectionHeading>
      <div className="mobile-match-list">
        {(activeRound?.matches ?? []).map((match: Round) => <MobileMatchRow key={String(match.id)} match={match} />)}
      </div>
      {activeRound && (
        <>
          <MobileSectionHeading>Más</MobileSectionHeading>
          <MobileSectionLink href={`/matches/round/${activeRound.round_id}`} title="Detalle de jornada" description="Partidos y contexto completo" icon={MapPinned} accent="blue" />
        </>
      )}
    </MobileScreen>
  );
}
