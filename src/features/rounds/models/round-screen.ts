import type { RoundOptionViewModel } from './round-read';

export interface RoundDisplayRow {
  key: string;
  index: number;
  title: string;
  subtitle?: string;
  value?: string;
  href?: string;
}
export interface RoundOverviewViewModel {
  rounds: RoundOptionViewModel[];
  activeRoundId: string | number | null | undefined;
  description: string;
  points: string;
  ideal: string;
  efficiency: string;
  playerCount: number;
  rows: RoundDisplayRow[];
}
export interface RoundSectionViewModel {
  rows: RoundDisplayRow[];
  points: number;
  ideal: number;
}
