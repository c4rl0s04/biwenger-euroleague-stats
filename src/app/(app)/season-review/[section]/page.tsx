import MobileSeasonReviewDetail from '@/components/mobile/screens/MobileSeasonReviewDetail';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getSeasonReviewPageData } from '@/lib/season-review/read-analysis';

type ReviewSection = 'real' | 'limits' | 'simulations' | 'configurations' | 'methodology';
type PageProps = { params: Promise<{ section: string }> };

export default async function SeasonReviewSectionPage({ params }: PageProps) {
  const { section } = await params;
  const valid = ['real', 'limits', 'simulations', 'configurations', 'methodology'];
  await requireMobileRoute(`/season-review/${section}`);
  if (!valid.includes(section)) return null;
  const { overview, simulationAnalysis } = await getSeasonReviewPageData();
  return <MobileSeasonReviewDetail section={section as ReviewSection} overview={overview} analysis={simulationAnalysis} />;
}
