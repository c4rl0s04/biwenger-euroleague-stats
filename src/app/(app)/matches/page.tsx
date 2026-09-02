import { MatchesScreen } from '@/features/matches/public';
import { getMatchesScreenData } from '@/features/matches/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const revalidate = 300; // Revalidate every 5 minutes

type PageProps = { searchParams: Promise<{ roundId?: string }> };

export default async function MatchesPage({ searchParams }: PageProps) {
  const modelPromise = searchParams.then(({ roundId }) => getMatchesScreenData(roundId));
  const [model, phone] = await Promise.all([modelPromise, isPhonePresentation()]);
  return <MatchesScreen model={model} presentation={phone ? 'phone' : 'desktop'} />;
}
