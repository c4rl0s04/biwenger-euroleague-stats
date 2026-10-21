import { mapTeamSectionRows } from '../../models/mobile-rows';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';

import type { TeamProfileSection, TeamProfileViewModel } from '../../models/team-profile';

export function TeamProfileSectionScreen({
  model,
  section,
  title,
}: {
  model: TeamProfileViewModel;
  section: TeamProfileSection;
  title: string;
}) {
  return (
    <MobileDetailScaffold title={title} context={model.name} backHref={`/team/${model.id}`}>
      <MobileSectionHeading>
        {section === 'roster' ? 'Jugadores' : 'Calendario y resultados'}
      </MobileSectionHeading>
      <MobileRecordList rows={mapTeamSectionRows(model, section)} />
    </MobileDetailScaffold>
  );
}
