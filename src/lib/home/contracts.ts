export const HOME_FEED_PAGE_SIZE = 15;

export const HOME_ACTIVITY_FILTERS = [
  'all',
  'transfers',
  'rounds',
  'highlights',
  'predictions',
  'results',
] as const;

export type HomeActivityFilter = (typeof HOME_ACTIVITY_FILTERS)[number];

export function isHomeActivityFilter(value: unknown): value is HomeActivityFilter {
  return typeof value === 'string' && (HOME_ACTIVITY_FILTERS as readonly string[]).includes(value);
}

export function normalizeHomeActivityFilter(value: unknown): HomeActivityFilter | null {
  if (value === 'bonuses') return 'rounds';
  return isHomeActivityFilter(value) ? value : null;
}

export interface HomeActivityBase {
  id: string;
  occurredAt: string;
}

export interface TransferParty {
  id: string | null;
  name: string;
  icon: string | null;
  colorIndex: number;
  isMarket: boolean;
}

export interface TransferActivityItem extends HomeActivityBase {
  player: {
    id: number;
    name: string;
    position: string | null;
    image: string | null;
    teamCode: string | null;
  };
  seller: TransferParty;
  buyer: TransferParty;
  amount: number;
  marketValue: number | null;
  marketValueAt: string | null;
}

export interface TransferDayActivity extends HomeActivityBase {
  type: 'transfer_day';
  date: string;
  transfers: TransferActivityItem[];
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

export type PredictionParticipation = 'complete' | 'partial' | 'absent';

export interface PredictionParticipant {
  userId: string;
  name: string;
  icon: string | null;
  colorIndex: number;
  participation: PredictionParticipation;
  hits: number;
  position: number | null;
  userMatches: number;
  predictions: Array<'1' | 'X' | '2' | null>;
}

export interface PredictionRoundActivity extends HomeActivityBase {
  type: 'prediction_round';
  roundId: number;
  roundName: string;
  totalMatches: number;
  actualResults: Array<'1' | 'X' | '2'>;
  participants: PredictionParticipant[];
}

export type RoundHighlightRole = 'titular' | '6th_man' | 'bench';

export interface RoundHighlightPlayer {
  id: number;
  name: string;
  position: string | null;
  image: string | null;
  teamName: string | null;
  points: number;
  valuation: number;
  role: RoundHighlightRole;
  multiplier: number;
  isCaptain: boolean;
}

export interface RoundHighlightActivity extends HomeActivityBase {
  type: 'round_highlight';
  roundId: number;
  roundName: string;
  mvps: RoundHighlightPlayer[];
  idealLineup: RoundHighlightPlayer[];
  totalPoints: number;
}

export interface TournamentActivityManager {
  id: string;
  name: string;
  icon: string | null;
  colorIndex: number;
  score: number;
}

export interface TournamentActivityFixture {
  id: number;
  home: TournamentActivityManager;
  away: TournamentActivityManager;
}

export interface TournamentRoundActivity extends HomeActivityBase {
  type: 'tournament_round';
  tournamentId: number;
  tournamentName: string;
  roundId: number;
  roundName: string;
  fixtures: TournamentActivityFixture[];
  champion: Omit<TournamentActivityManager, 'score'> | null;
}

export type HomeActivityEvent =
  | TransferDayActivity
  | RoundCompletedActivity
  | AdminBonusActivity
  | MatchSessionActivity
  | PredictionRoundActivity
  | RoundHighlightActivity
  | TournamentRoundActivity;

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
