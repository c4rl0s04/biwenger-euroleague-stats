import { mapCatalogueRows, catalogueInsightRows } from '../../models/mobile-rows';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';

import type {
  PlayerCatalogueInsightsViewModel,
  PlayerCatalogueItemViewModel,
  PlayerCatalogueSection,
} from '../../models/player-catalogue';

export function PlayerCatalogueSectionScreen({
  section,
  title,
  players,
}: {
  section: PlayerCatalogueSection;
  title: string;
  players?: PlayerCatalogueItemViewModel[];
  insights?: PlayerCatalogueInsightsViewModel;
}) {
  const rows = section === 'insights' ? catalogueInsightRows : mapCatalogueRows(players ?? []);
  return (
    <MobileDetailScaffold
      title={title}
      context="Jugadores"
      backHref="/players"
      description={
        section === 'insights'
          ? 'Forma y producción reciente para encontrar oportunidades.'
          : 'Cómo se distribuye el talento entre las plantillas de la liga.'
      }
    >
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <MobileRecordList rows={rows} />
    </MobileDetailScaffold>
  );
}
