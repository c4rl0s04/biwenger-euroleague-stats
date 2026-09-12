import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getStandingsSection } from '@/features/standings/server';
import { StandingsSectionScreen } from '@/features/standings/public';

type PageProps = { params: Promise<{ section: string }> };

export default async function StandingsSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/standings/${section}`);
  const data = await getStandingsSection(section);

  return <StandingsSectionScreen section={section} title={route.definition.title} data={data} />;
}
