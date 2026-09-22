import { getHomeFeedPage } from '../server/services/feed.service';

import MobileActivityFeed from '../components/MobileActivityFeed';
import type { HomeActivityFilter } from '@/features/home/models/contracts';

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
