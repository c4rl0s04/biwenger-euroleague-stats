import { auth } from '@/auth';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { getCompareDataLite, mapCompareOpponent } from '@/features/compare/server';
import { CompareOpponentScreen } from '@/features/compare/public';

export default async function CompareOpponentPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const route = await requireMobileRoute(`/compare/${userId}`);
  const [data, session] = await Promise.all([getCompareDataLite(), auth()]);
  const model = mapCompareOpponent(data, userId, session?.user?.id);
  return model ? <CompareOpponentScreen model={model} title={route.definition.title} /> : null;
}
