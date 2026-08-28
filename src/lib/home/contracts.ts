export const HOME_FEED_PAGE_SIZE = 15;

export interface HomeActivityBase {
  id: string;
  occurredAt: string;
}

export interface TransferActivity extends HomeActivityBase {
  type: 'transfer';
  player: {
    id: number;
    name: string;
    position: string | null;
    image: string | null;
    teamCode: string | null;
  };
  seller: { id: string | null; name: string };
  buyer: { id: string | null; name: string };
  amount: number;
}

export interface RoundParticipant {
  userId: string;
  name: string;
  icon: string | null;
  colorIndex: number;
  position: number;
  points: number;
  bonus: number;
}

export interface RoundCompletedActivity extends HomeActivityBase {
  type: 'round_completed';
  roundId: number;
  roundName: string;
  totalBonus: number;
  participants: RoundParticipant[];
}

export interface AdminBonusActivity extends HomeActivityBase {
  type: 'admin_bonus';
  recipient: {
    id: string;
    name: string;
    icon: string | null;
    colorIndex: number;
  };
  amount: number;
  description: string;
}

export interface MatchResult {
  id: number;
  home: { id: number; name: string; code: string | null; image: string | null; score: number };
  away: { id: number; name: string; code: string | null; image: string | null; score: number };
}

export interface MatchSessionActivity extends HomeActivityBase {
  type: 'match_session';
  roundId: number;
  roundName: string;
  sessionDate: string;
  matches: MatchResult[];
}

export type HomeActivityEvent =
  | TransferActivity
  | RoundCompletedActivity
  | AdminBonusActivity
  | MatchSessionActivity;

export interface HomeFeedPage {
  items: HomeActivityEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface HomeAlert {
  type: 'price_gain' | 'price_loss' | 'good_performance' | 'info';
  message: string;
  severity: 'success' | 'warning' | 'info' | 'error';
}

export interface HomeSummary {
  seasonId: string;
  seasonName: string;
  phase: 'preseason' | 'active' | 'finished';
  user: {
    id: string;
    name: string;
    position: number | null;
    totalPoints: number;
    teamValue: number;
    priceTrend: number;
  };
  round: {
    id: number | null;
    name: string | null;
    status: 'upcoming' | 'live' | 'finished' | 'unavailable';
    startsAt: string | null;
  };
  alerts: HomeAlert[];
}

