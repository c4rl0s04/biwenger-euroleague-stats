import DesktopHome from '@/components/home/DesktopHome';
import MobileHomeScreen from '@/components/mobile/screens/MobileHomeScreen';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { normalizeHomeActivityFilter } from '@/lib/home/contracts';

export default async function Home({ searchParams }) {
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
