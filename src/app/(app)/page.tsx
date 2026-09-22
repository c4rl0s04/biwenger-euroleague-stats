import { DesktopHome, normalizeHomeActivityFilter } from '@/features/home/public';
import { MobileHomeScreen } from '@/features/home/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isPhonePresentation()) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login?callbackUrl=%2F');
    const params = await searchParams;
    const requestedFilter = Array.isArray(params?.activity) ? params.activity[0] : params?.activity;
    if (requestedFilter === 'bonuses') {
      const normalizedParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        const firstValue = Array.isArray(value) ? value[0] : value;
        if (typeof firstValue === 'string') normalizedParams.set(key, firstValue);
      });
      normalizedParams.set('activity', 'rounds');
      redirect(`/?${normalizedParams.toString()}`);
    }
    const initialFilter = normalizeHomeActivityFilter(requestedFilter) ?? 'all';
    return <MobileHomeScreen userId={String(session.user.id)} initialFilter={initialFilter} />;
  }

  return <DesktopHome />;
}
