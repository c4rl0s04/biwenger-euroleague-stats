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
  insights,
}: {
  section: PlayerCatalogueSection;
  title: string;
  players?: PlayerCatalogueItemViewModel[];
  insights?: PlayerCatalogueInsightsViewModel;
}) {
  const data =
    section === 'insights'
      ? [insights?.topPerformers ?? [], insights?.streaks ?? { hot: [], cold: [] }]
      : (players ?? []);
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
      <MobileRecordList data={data} linkPrefix="/player" />
    </MobileDetailScaffold>
  );
}
