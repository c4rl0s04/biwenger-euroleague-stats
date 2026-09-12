import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import type { TournamentSectionModel } from '../../models/tournament-section';

interface Props {
  id: string;
  section: string;
  title: string;
  model: TournamentSectionModel;
}
export default function TournamentSectionScreen({ id, section, title, model }: Props) {
  return (
    <MobileDetailScaffold title={title} context={model.name} backHref={`/tournaments/${id}`}>
      <MobileSectionHeading>
        {section === 'standings' ? 'Clasificación' : 'Enfrentamientos'}
      </MobileSectionHeading>
      <MobileRecordList
        data={model.data}
        linkPrefix={section === 'standings' ? '/user' : undefined}
      />
    </MobileDetailScaffold>
  );
}
