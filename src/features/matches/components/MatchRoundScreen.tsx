import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';

import type { MatchRoundScreenViewModel } from '../models/match';
import MobileMatchRow from './mobile/MobileMatchRow';

export function MatchRoundScreen({
  model,
  fallbackTitle,
}: {
  model: MatchRoundScreenViewModel;
  fallbackTitle: string;
}) {
  const roundId = model.selectedRoundId;
  return (
    <MobileDetailScaffold
      title={model.round?.roundName ?? fallbackTitle}
      context="Partidos"
      backHref={`/matches${roundId ? `?roundId=${roundId}` : ''}`}
    >
      <MobileSectionHeading>Partidos</MobileSectionHeading>
      <div className="mobile-match-list">
        {(model.round?.matches ?? []).map((match) => (
          <MobileMatchRow key={match.id} match={match} />
        ))}
      </div>
    </MobileDetailScaffold>
  );
}
