import { Suspense } from 'react';

import { MobileScreen } from '../MobileScreen';
import HomeFeedSection from '../home/HomeFeedSection';
import HomeSummarySection from '../home/HomeSummarySection';
import { HomeFeedSkeleton, HomeSummarySkeleton } from '../home/HomeSkeletons';

export default function MobileHomeScreen({ userId }: { userId: string }) {
  return (
    <MobileScreen className="mobile-home-screen" labelledBy="mobile-screen-title">
      <Suspense fallback={<HomeSummarySkeleton />}>
        <HomeSummarySection userId={userId} />
      </Suspense>
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeedSection />
      </Suspense>
    </MobileScreen>
  );
}
