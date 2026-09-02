import type { MatchScheduleViewModel } from '@/features/matches/public';

export type TeamMatchDifficulty = 'Fácil' | 'Normal' | 'Duro';
export type TeamProfileSection = 'roster' | 'matches';

export interface TeamProfileMetricsViewModel {
  totalFantasyPoints: number;
  totalRealPoints: number;
  averagePir: number;
  totalValue: number;
  rosterSize: number;
  matchesPlayed: number;
  playoffProbability: number;
  wins: number;
  losses: number;
  rank: number;
}

export interface TeamRosterPlayerViewModel {
  id: number;
  name: string;
  imageUrl: string;
  position: string;
  price: number;
  priceIncrement: number;
  points: number;
  average: number;
  ownerId: number | null;
  ownerName: string | null;
  ownerColorIndex: number;
  ownerIcon: string | null;
  recentScores: string | null;
}

export interface TeamProfileMatchViewModel extends MatchScheduleViewModel {
  difficulty?: TeamMatchDifficulty;
}

export interface TeamProfileViewModel {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  metrics: TeamProfileMetricsViewModel;
  roster: TeamRosterPlayerViewModel[];
  upcomingMatches: TeamProfileMatchViewModel[];
  recentMatches: TeamProfileMatchViewModel[];
}

export interface TeamProfileApiModel {
  id: number;
  name: string;
  short_name: string;
  logo: string;
  total_fantasy_points: number;
  total_real_points: number;
  avg_pir: number;
  total_value: number;
  roster_size: number;
  matches_played: number;
  playoff_probability: number;
  wins: number;
  losses: number;
  rank: number;
  roster: Array<{
    id: number;
    name: string;
    img: string;
    position: string;
    price: number;
    price_increment: number;
    points: number;
    average: number;
    owner_id: number | null;
    owner_name: string | null;
    owner_color_index: number;
    owner_icon: string | null;
    recent_scores: string | null;
  }>;
  upcomingMatches: TeamProfileApiMatch[];
  recentMatches: TeamProfileApiMatch[];
}

export interface TeamProfileApiMatch {
  date: string | null;
  home_team: string;
  away_team: string;
  home_img: string;
  away_img: string;
  home_id: number;
  away_id: number;
  home_score: number | null;
  away_score: number | null;
  round_name: string;
  difficulty?: TeamMatchDifficulty;
}
