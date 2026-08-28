import type { HomeActivityEvent } from '@/lib/home/contracts';

import AdminBonusActivityCard from './AdminBonusActivityCard';
import MatchSessionActivityCard from './MatchSessionActivityCard';
import RoundActivityCard from './RoundActivityCard';
import TransferDayActivityCard from './TransferDayActivityCard';

export default function HomeActivityEventCard({ event }: { event: HomeActivityEvent }) {
  switch (event.type) {
    case 'transfer_day':
      return <TransferDayActivityCard event={event} />;
    case 'round_completed':
      return <RoundActivityCard event={event} />;
    case 'admin_bonus':
      return <AdminBonusActivityCard event={event} />;
    case 'match_session':
      return <MatchSessionActivityCard event={event} />;
  }
}
