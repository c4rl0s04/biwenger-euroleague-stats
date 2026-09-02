import { PageHeader } from '@/components/ui';

import type { MatchesScreenViewModel } from '../models/match';
import MatchesClient from './desktop/MatchesClient';
import MobileMatchesScreen from './mobile/MobileMatchesScreen';

export function MatchesScreen({
  model,
  presentation,
}: {
  model: MatchesScreenViewModel;
  presentation: 'desktop' | 'phone';
}) {
  if (presentation === 'phone') {
    return <MobileMatchesScreen rounds={model.rounds} activeRoundId={model.selectedRoundId} />;
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Partidos"
        description="Calendario y resultados de la temporada"
        className="pb-10"
      />
      <MatchesClient
        rounds={model.rounds}
        defaultRoundId={model.currentRoundId ?? model.selectedRoundId}
      />
    </div>
  );
}
