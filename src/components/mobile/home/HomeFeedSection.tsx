import { getHomeFeedPage } from '@/lib/services/app/homeService';

import MobileActivityFeed from './MobileActivityFeed';

export default async function HomeFeedSection() {
  const result = await getHomeFeedPage()
    .then((initialPage) => ({ initialPage, error: null }))
    .catch((error) => {
      console.error('Mobile home feed error:', error);
      return { initialPage: null, error: 'No se pudo cargar la actividad.' };
    });

  return (
    <MobileActivityFeed initialPage={result.initialPage} initialError={result.error ?? undefined} />
  );
}
