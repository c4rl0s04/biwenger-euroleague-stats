import { Suspense } from 'react';

import { MobileScreen } from '@/components/mobile/MobileScreen';
import HomeFeedSection from './HomeFeedSection';
import HomeSummarySection from './HomeSummarySection';
import { HomeFeedSkeleton, HomeSummarySkeleton } from '../components/HomeSkeletons';
import MobileHomeActivityProvider from '../components/MobileHomeActivityProvider';
import type { HomeActivityFilter } from '@/features/home/models/contracts';

export default function MobileHomeScreen({
  userId,
  initialFilter,
}: {
  userId: string;
  initialFilter: HomeActivityFilter;
}) {
  return (
    <MobileHomeActivityProvider initialFilter={initialFilter}>
      <MobileScreen className="mobile-home-screen" labelledBy="mobile-screen-title">
        <Suspense fallback={<HomeSummarySkeleton />}>
          <HomeSummarySection userId={userId} />
        </Suspense>
        <Suspense fallback={<HomeFeedSkeleton />}>
          <HomeFeedSection initialFilter={initialFilter} />
        </Suspense>
      </MobileScreen>
    </MobileHomeActivityProvider>
  );
}
