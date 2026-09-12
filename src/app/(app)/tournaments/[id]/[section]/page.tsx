import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getTournamentSection } from '@/features/tournaments/server';
import { TournamentSectionScreen } from '@/features/tournaments/public';

type PageProps = { params: Promise<{ id: string; section: string }> };

export default async function TournamentSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/tournaments/${id}/${section}`);
  const model = await getTournamentSection(id, section);
  if (!model) return null;
  return (
    <TournamentSectionScreen
      id={id}
      section={section}
      title={route.definition.title}
      model={model}
    />
  );
}
