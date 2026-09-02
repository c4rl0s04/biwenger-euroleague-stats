import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';

import type {
  TeamProfileMatchViewModel,
  TeamProfileSection,
  TeamProfileViewModel,
} from '../../models/team-profile';

function toMobileMatchRecord(match: TeamProfileMatchViewModel) {
  return {
    round_name: match.roundName,
    date: match.date,
    home_team: match.home.name,
    away_team: match.away.name,
    home_score: match.home.score,
    away_score: match.away.score,
  };
}

export function TeamProfileSectionScreen({
  model,
  section,
  title,
}: {
  model: TeamProfileViewModel;
  section: TeamProfileSection;
  title: string;
}) {
  const data =
    section === 'roster'
      ? model.roster
      : [...model.upcomingMatches, ...model.recentMatches].map(toMobileMatchRecord);

  return (
    <MobileDetailScaffold title={title} context={model.name} backHref={`/team/${model.id}`}>
      <MobileSectionHeading>
        {section === 'roster' ? 'Jugadores' : 'Calendario y resultados'}
      </MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'roster' ? '/player' : undefined} />
    </MobileDetailScaffold>
  );
}
