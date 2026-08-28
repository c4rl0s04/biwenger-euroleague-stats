import { getHomeFeedPage } from '@/lib/services/app/homeService';

import MobileActivityFeed from './MobileActivityFeed';
import type { HomeActivityFilter } from '@/lib/home/contracts';

export default async function HomeFeedSection({
  initialFilter,
}: {
  initialFilter: HomeActivityFilter;
}) {
  const result = await getHomeFeedPage({ filter: initialFilter })
    .then((initialPage) => ({ initialPage, error: null }))
    .catch((error) => {
      console.error('Mobile home feed error:', error);
      return { initialPage: null, error: 'No se pudo cargar la actividad.' };
    });

  return (
    <MobileActivityFeed
      initialFilter={initialFilter}
      initialPage={result.initialPage}
      initialError={result.error ?? undefined}
    />
  );
}
