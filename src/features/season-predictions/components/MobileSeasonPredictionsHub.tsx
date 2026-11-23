import { CalendarRange, ListOrdered, Trophy } from 'lucide-react';
import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '@/components/mobile/MobileScreen';
import { HUB_SECTION_TITLES, type HubSection, type SeasonPredictionsHubData } from '../models/hub';
import { phaseDescription, phaseStatusLabel } from './PhaseOverview';
import { SeasonPredictionsScreen } from './SeasonPredictionsScreen';

const ICONS = { preseason: CalendarRange, playoffs: Trophy, leaderboard: ListOrdered } as const;

/** Phone hub: phase links, with the active preseason editor shown inline. */
export function MobileSeasonPredictionsHub({
  seasonName,
  data,
}: {
  seasonName: string;
  data: SeasonPredictionsHubData;
}) {
  const links: { id: HubSection; description: string; meta?: string }[] = [
    ...data.phases.map((summary) => ({
      id: summary.phase,
      description: phaseDescription(summary),
      meta: phaseStatusLabel(summary),
    })),
    {
      id: 'leaderboard',
      description: data.leaderboard
        ? 'Puntos totales y por fase de cada mánager.'
        : 'Aparece al cerrar la pretemporada.',
    },
  ];
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow={seasonName} title="Predicciones" />
      <div className="space-y-2 pt-6">
        {links.map((link) => (
          <MobileSectionLink
            key={link.id}
            href={`/season-predictions/${link.id}`}
            title={HUB_SECTION_TITLES[link.id]}
            description={link.description}
            meta={link.meta}
            icon={ICONS[link.id]}
            accent={link.id === data.activePhase ? 'orange' : 'blue'}
          />
        ))}
      </div>
      {data.activePhase === 'preseason' ? (
        <>
          <div className="pt-8">
            <MobileSectionHeading>{HUB_SECTION_TITLES.preseason}</MobileSectionHeading>
          </div>
          <SeasonPredictionsScreen
            key={`${data.seasonId}-${data.preseason.status}`}
            seasonName={seasonName}
            data={data.preseason}
            results={data.preseasonResults}
            phone
          />
        </>
      ) : null}
    </MobileScreen>
  );
}
