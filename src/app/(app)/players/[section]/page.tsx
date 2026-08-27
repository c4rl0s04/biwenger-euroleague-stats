import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchAllPlayers, fetchPlayerStreaks, getTopPerformers } from '@/lib/services';

type PageProps = { params: Promise<{ section: string }> };

export default async function PlayersSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/players/${section}`);
  const data =
    section === 'insights'
      ? await Promise.all([getTopPerformers(20), fetchPlayerStreaks(3)])
      : await fetchAllPlayers();

  return (
    <MobileDetailScaffold
      title={route.definition.title}
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
