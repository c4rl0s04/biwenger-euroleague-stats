import { Suspense } from 'react';

import { MobileScreen } from '../MobileScreen';
import HomeFeedSection from '../home/HomeFeedSection';
import HomeSummarySection from '../home/HomeSummarySection';
import { HomeFeedSkeleton, HomeSummarySkeleton } from '../home/HomeSkeletons';
import MobileHomeActivityProvider from '../home/MobileHomeActivityProvider';
import type { HomeActivityFilter } from '@/lib/home/contracts';

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
