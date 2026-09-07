import { ManagerProfileSectionScreen } from '@/features/managers/public';
import { getManagerProfileSection } from '@/features/managers/server';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { params: Promise<{ id: string; section: string }> };

export default async function ManagerSectionPage({ params }: PageProps) {
  const { id, section } = await params;
  const route = await requireMobileRoute(`/user/${id}/${section}`);
  const data = await getManagerProfileSection(id, section);

  return (
    <ManagerProfileSectionScreen
      title={route.definition.title}
      data={data}
      backHref={`/user/${id}`}
    />
  );
}
