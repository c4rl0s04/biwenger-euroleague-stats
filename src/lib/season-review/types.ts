export const REVIEW_SEASON_ID = '2025-26' as const;

export type PayoutMode = 'inverse' | 'direct' | 'hybrid' | 'equal';
export type BudgetMode = 'literal' | 'neutral';
export type PositionPreset =
  | 'none'
  | 'winner'
  | 'podium-light'
  | 'podium-strong'
  | 'bottom-support'
  | 'custom';

export interface ScenarioConfig {
  rosterCap: 18 | 20 | 22 | 25;
  payoutMode: PayoutMode;
  eurosPerPoint: 5000 | 7500 | 10000;
  meritWeight: 0 | 0.25 | 0.5 | 0.75 | 1;
  positionPreset: PositionPreset;
  positionBonuses: number[];
  idealPlayerBonus: 0 | 50000 | 100000;
  mvpBonus: 0 | 60000 | 150000;
  stackMvpAndIdeal: boolean;
  marketSlots: 10 | 15 | 20 | 25 | 30;
  squadValueCap: null | 70000000 | 80000000 | 90000000 | 100000000 | 110000000;
  budgetMode: BudgetMode;
}

export interface ReviewUser {
  id: string;
  name: string;
  color: string;
  initialSquadValue: number;
  finalSquadValue: number;
  finalRosterSize: number;
  marketNet: number;
}

export interface ReviewRoundUser {
  userId: string;
  points: number;
  participated: boolean;
  recordedBonus: number;
  porraResidual: number;
  idealHits: number;
  mvpHits: number;
}

export interface ReviewRound {
  id: number;
  name: string;
  users: ReviewRoundUser[];
}

export interface StructuralSnapshot {
  rosterSizes: number[];
  squadValues: number[];
  automaticMarketSlots: number[];
  totalPlayers: number;
  marketDays: number;
}

export interface SeasonReviewDataset {
  seasonId: typeof REVIEW_SEASON_ID;
  users: ReviewUser[];
  rounds: ReviewRound[];
  structural: StructuralSnapshot;
  baselineRecordedPayout: number;
  baselinePorraResidual: number;
}

export interface ScoreBreakdown {
  equality: number;
  competitiveness: number;
  merit: number;
  liquidity: number;
  practicality: number;
}

export interface UserScenarioResult {
  userId: string;
  name: string;
  points: number;
  basePayout: number;
  positionPayout: number;
  idealPayout: number;
  mvpPayout: number;
  porraPayout: number;
  totalPayout: number;
  baselinePayout: number;
  delta: number;
  estimatedResources: number;
}

export interface ConfidenceInterval {
  low: number;
  high: number;
}

export interface ScenarioResult {
  config: ScenarioConfig;
  users: UserScenarioResult[];
  scores: ScoreBreakdown;
  totalPayout: number;
  baselinePayout: number;
  inflation: number;
  gini: number;
  baselineGini: number;
  coefficientOfVariation: number;
  resourceRatio: number;
  rosterBreachRate: number;
  rosterMaxExcess: number;
  valueCapBreachRate: number;
  valueCapMaxExcess: number;
  expectedMarketWaitDays: number;
  confidence: 'high' | 'medium' | 'low';
  intervals?: {
    totalPayout: ConfidenceInterval;
    gini: ConfidenceInterval;
  };
}

export interface RecommendationProfile {
  id: 'equality' | 'balanced' | 'merit';
  name: string;
  description: string;
  weights: ScoreBreakdown;
  winner: ScenarioResult;
  runnerUp: ScenarioResult;
}

export interface DataQualityReport {
  rawFinanceRows: number;
  uniqueFinanceEvents: number;
  comparableRounds: number;
  financeOnlyRounds: number;
  users: number;
  transfers: number;
  initialSquadRows: number;
  marketValueRows: number;
  marketSnapshotDays: number;
  warnings: string[];
}

export interface TimelinePoint {
  roundId: number;
  roundName: string;
  cumulativePayout: number;
  cumulativePoints: number;
  payoutGini: number;
}

export interface LeverDiagnostic {
  value: number | string;
  label: string;
  breachRate?: number;
  maxExcess?: number;
  expectedWaitDays?: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SeasonReviewOverview {
  seasonId: typeof REVIEW_SEASON_ID;
  baseline: ScenarioResult;
  recommendations: RecommendationProfile[];
  pareto: ScenarioResult[];
  timeline: TimelinePoint[];
  quality: DataQualityReport;
  diagnostics: {
    rosterCaps: LeverDiagnostic[];
    marketSlots: LeverDiagnostic[];
    squadValueCaps: LeverDiagnostic[];
  };
  defaults: ScenarioConfig;
  generatedAt: string;
}
