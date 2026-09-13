import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getPredictionSection } from '@/features/predictions/server';
import { PredictionSectionScreen } from '@/features/predictions/public';
type PageProps = { params: Promise<{ section: string }> };
export default async function PredictionsSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/predictions/${section}`);
  const model = await getPredictionSection(section);
  return <PredictionSectionScreen title={route.definition.title} model={model} />;
}
