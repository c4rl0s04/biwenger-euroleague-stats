import type { HomeActivityEvent } from '@/lib/home/contracts';

import AdminBonusActivityCard from './AdminBonusActivityCard';
import MatchSessionActivityCard from './MatchSessionActivityCard';
import PredictionActivityCard from './PredictionActivityCard';
import RoundActivityCard from './RoundActivityCard';
import RoundHighlightActivityCard from './RoundHighlightActivityCard';
import TransferDayActivityCard from './TransferDayActivityCard';
import TournamentRoundActivityCard from './TournamentRoundActivityCard';

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
    case 'prediction_round':
      return <PredictionActivityCard event={event} />;
    case 'round_highlight':
      return <RoundHighlightActivityCard event={event} />;
    case 'tournament_round':
      return <TournamentRoundActivityCard event={event} />;
  }
}
