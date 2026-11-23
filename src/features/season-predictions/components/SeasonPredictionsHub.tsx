import { PageCanvas, PageHeader, PageSection, SectionHeader } from '@/components/ui/foundation';
import type { SeasonPredictionsHubData } from '../models/hub';
import { HUB_SECTION_TITLES } from '../models/hub';
import { HubSectionAnchor } from './HubSectionAnchor';
import { PhaseOverview } from './PhaseOverview';
import { PlayoffsPhasePanel } from './PlayoffsPhasePanel';
import { SeasonPredictionsLeaderboard } from './SeasonPredictionsLeaderboard';
import { SeasonPredictionsScreen } from './SeasonPredictionsScreen';

/** Desktop hub: every phase on one page, in season order, with sidebar anchors. */
export function SeasonPredictionsHub({
  seasonName,
  data,
}: {
  seasonName: string;
  data: SeasonPredictionsHubData;
}) {
  const playoffs = data.phases.find((phase) => phase.phase === 'playoffs')!;
  return (
    <>
      <PageCanvas className="pb-0!">
        <div className="space-y-6">
          <PageHeader
            title="Predicciones"
            description={`Pretemporada, playoffs y la clasificación de la porra de ${seasonName}.`}
          />
          <PhaseOverview phases={data.phases} activePhase={data.activePhase} />
        </div>
      </PageCanvas>
      <SeasonPredictionsScreen
        key={`${data.seasonId}-${data.preseason.status}`}
        seasonName={seasonName}
        data={data.preseason}
        results={data.preseasonResults}
      />
      {(['playoffs', 'leaderboard'] as const).map((id) => (
        <PageSection key={id} id={id} aria-labelledby={`${id}-heading`} tone="alternate">
          <HubSectionAnchor id={id} title={HUB_SECTION_TITLES[id]} />
          <div className="space-y-5">
            <SectionHeader headingId={`${id}-heading`} title={HUB_SECTION_TITLES[id]} />
            {id === 'playoffs' ? (
              <PlayoffsPhasePanel summary={playoffs} />
            ) : (
              <SeasonPredictionsLeaderboard rows={data.leaderboard} />
            )}
          </div>
        </PageSection>
      ))}
    </>
  );
}
