import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { HUB_SECTION_TITLES, type HubSection, type SeasonPredictionsHubData } from '../models/hub';
import { PlayoffsPhasePanel } from './PlayoffsPhasePanel';
import { SeasonPredictionsLeaderboard } from './SeasonPredictionsLeaderboard';
import { SeasonPredictionsScreen } from './SeasonPredictionsScreen';

const HUB_HREF = '/season-predictions';

/** Phone section routes of the predictions hub. */
export function SeasonPredictionsSectionScreen({
  section,
  seasonName,
  data,
}: {
  section: HubSection;
  seasonName: string;
  data: SeasonPredictionsHubData;
}) {
  if (section === 'preseason')
    return (
      <SeasonPredictionsScreen
        key={`${data.seasonId}-${data.preseason.status}`}
        seasonName={seasonName}
        data={data.preseason}
        results={data.preseasonResults}
        phone
        phoneBackHref={HUB_HREF}
      />
    );
  return (
    <MobileDetailScaffold
      title={HUB_SECTION_TITLES[section]}
      context={seasonName}
      backHref={HUB_HREF}
    >
      <div className="pt-4">
        {section === 'playoffs' ? (
          <PlayoffsPhasePanel summary={data.phases.find((phase) => phase.phase === 'playoffs')!} />
        ) : (
          <SeasonPredictionsLeaderboard rows={data.leaderboard} />
        )}
      </div>
    </MobileDetailScaffold>
  );
}
