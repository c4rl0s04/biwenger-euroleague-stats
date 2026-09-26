export type CriteriaType =
  | 'team'
  | 'pos'
  | 'country'
  | 'stat'
  | 'price'
  | 'stat_avg'
  | 'stat_single'
  | 'stat_total'
  | 'double_double'
  | 'percentage'
  | 'user_ownership'
  | 'ownership'
  | 'price_min'
  | 'price_max'
  | 'age_max'
  | 'age_min'
  | 'height_min'
  | 'height_max';

export interface HoopgridCriteria {
  type: CriteriaType;
  value: any;
  label: string;
}

export interface HoopgridChallenge {
  id: string;
  gameDate: string;
  number: number;
  rows: HoopgridCriteria[];
  cols: HoopgridCriteria[];
  possibleCounts: number[];
  complexity: number;
  isActive: boolean;
  createdAt?: string | null;
}

export interface HoopgridChallengeSummary {
  id: string;
  gameDate: string;
  number: number | null;
  possibleCounts: string | number[] | null;
  complexity: number;
}

export interface HoopgridGuess {
  cellIndex: number;
  playerId: number | null;
  isCorrect: boolean;
  playerName?: string | null;
  playerImg?: string | null;
  rarity?: number | null;
}

export interface HoopgridTodayResponse {
  challenge: HoopgridChallenge;
  userGuesses: HoopgridGuess[];
}

export interface HoopgridCheatsheetPlayer {
  id: number;
  name: string;
  teamId: string | null;
  price: number | null;
  img: string | null;
}

export interface HoopgridCheatsheetSolution {
  rowLabel: string;
  colLabel: string;
  players: HoopgridCheatsheetPlayer[];
}

export interface HoopgridCheatsheetData {
  challenge: HoopgridChallenge;
  allChallenges: HoopgridChallengeSummary[];
  solutions: HoopgridCheatsheetSolution[];
  currentDate: string;
  currentNumber: number;
  prevDate: string;
  nextDate: string;
  isLatest: boolean;
}

export interface SubmitGuessInput {
  challengeId: string;
  cellIndex: number;
  playerId: number;
  dryRun?: boolean;
}

export interface SubmitGuessResult {
  isCorrect: boolean;
  rarity: number | null;
  guess?: any;
}

export interface SubmitBatchGuessesInput {
  challengeId: string;
  guesses: Record<string, { playerId: number; isCorrect: boolean }>;
}

export interface SubmitBatchGuessesResult {
  success: boolean;
  results: Array<{ cellIndex: number; isCorrect: boolean; rarity: number | null; guess?: any }>;
}
