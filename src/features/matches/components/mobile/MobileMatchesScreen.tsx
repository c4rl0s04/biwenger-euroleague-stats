import { MapPinned } from 'lucide-react';

import MobileMatchRow from './MobileMatchRow';
import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '@/components/mobile/MobileScreen';
import MobileSegmentedControl from '@/components/mobile/MobileSegmentedControl';
import type { MatchRoundViewModel } from '../../models/match';

export default function MobileMatchesScreen({ rounds, activeRoundId }: { rounds: MatchRoundViewModel[]; activeRoundId: number | null }) {
  const activeRound = rounds.find((round) => round.roundId === activeRoundId) ?? rounds[0];
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Euroleague" title="Partidos" description={activeRound?.roundName ?? 'Calendario'} />
      <div className="mobile-control-offset">
        <MobileSegmentedControl
          label="Seleccionar jornada"
          items={rounds.map((round) => ({ label: round.roundName.replace('Jornada ', 'J'), href: `/matches?roundId=${round.roundId}`, active: round.roundId === activeRound?.roundId }))}
        />
      </div>
      <MobileSectionHeading>{activeRound?.roundName ?? 'Jornada'}</MobileSectionHeading>
      <div className="mobile-match-list">
        {(activeRound?.matches ?? []).map((match) => <MobileMatchRow key={match.id} match={match} />)}
      </div>
      {activeRound && (
        <>
          <MobileSectionHeading>Más</MobileSectionHeading>
          <MobileSectionLink href={`/matches/round/${activeRound.roundId}`} title="Detalle de jornada" description="Partidos y contexto completo" icon={MapPinned} accent="blue" />
        </>
      )}
    </MobileScreen>
  );
}
