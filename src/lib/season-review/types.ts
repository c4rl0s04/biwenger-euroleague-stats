export const REVIEW_SEASON_ID = '2025-26' as const;

export type PayoutDirection = 'direct' | 'inverse';
export type ShockKind = 'bad-transfer' | 'bad-streak' | 'star-injury' | 'inactivity';
export type ShockSeverity = 'low' | 'medium' | 'high';

export interface EconomicLedgerInput {
  startingBudget: number;
  users: Array<{ id: string; name: string }>;
  initialSquads: Array<{ userId: string; playerId: number; price: number }>;
  days: string[];
  marketValues: Array<{ day: string; playerId: number; price: number }>;
  transfers: Array<{
    day: string;
    timestamp: number;
    playerId: number;
    price: number;
    sellerId: string | null;
    buyerId: string | null;
  }>;
  bonuses: Array<{ day: string; userId: string; amount: number }>;
  roundPoints: Array<{ day: string; roundId: number; userId: string; points: number }>;
}

export interface OwnedPlayerSnapshot {
  playerId: number;
  value: number;
  acquisitionPrice: number;
  source: 'initial' | 'market';
}

export interface EconomicSnapshot {
  day: string;
  userId: string;
  userName: string;
  cash: number;
  squadValue: number;
  totalResources: number;
  rosterSize: number;
  cumulativeBonuses: number;
  cumulativePoints: number;
  initialAssetPnl: number;
  marketAssetPnl: number;
  players: OwnedPlayerSnapshot[];
}

export interface EconomicLedger {
  snapshots: EconomicSnapshot[];
}

export interface RosterCapDiagnostic {
  cap: number;
  breachRate: number;
  affectedUsers: number;
  breachedUserDays: number;
  maxExcess: number;
  averageMinimumReleaseValue: number;
  averageMaximumReleaseValue: number;
}

export interface ResilienceConfig {
  rosterCap: number;
  payoutDirection: PayoutDirection;
  eurosPerPoint: number;
  marketSlots: number;
}

export interface ShockConfig {
  kind: ShockKind;
  severity: ShockSeverity;
  appliedRound: number;
}

export interface RecoveryEnvironment {
  roundsRemaining: number;
  users: number;
  averageTopPoints: number;
  averageMedianPoints: number;
  averageBottomPoints: number;
  observedReturnSamples: number[];
  capLiquidityByLimit: Record<number, number>;
  marketConfidence: 'high' | 'medium' | 'low';
}

export interface RecoveryResult {
  modelVersion: 'gap-v2' | 'agent-season-v3';
  simulationCount: number;
  config: ResilienceConfig;
  shock: ShockConfig;
  recoveryProbability: number;
  recoveryInterval95?: [number, number];
  economicRecoveryProbability: number;
  competitiveRecoveryProbability: number;
  lockInProbability: number;
  medianRecoveryRounds: number;
  p90RecoveryRounds: number;
  medianRemainingEconomicGap: number;
  medianRemainingCompetitiveGap: number;
  medianFinalResourceGini?: number;
  medianFinalSquadGini?: number;
  medianMidseasonContenders?: number;
  medianTransactions?: number;
  medianPurchases?: number;
  medianFinalResourceGap?: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface HistoricalUserPoint {
  userId: string;
  name: string;
  color: string;
  cash: number;
  squadValue: number;
  totalResources: number;
  rosterSize: number;
  cumulativeBonuses: number;
  cumulativePoints: number;
}

export interface HistoricalTimelinePoint {
  day: string;
  resourceGini: number;
  squadGini: number;
  absoluteResourceGap: number;
  absoluteSquadGap: number;
  users: HistoricalUserPoint[];
}

export interface PairMoment {
  day: string;
  leader: HistoricalUserPoint;
  laggard: HistoricalUserPoint;
  resourceGap: number;
  squadGap: number;
  pointsGap: number;
}

export interface GapContribution {
  id: 'initial-assets' | 'market' | 'bonuses';
  label: string;
  leaderValue: number;
  laggardValue: number;
  gapContribution: number;
  interpretation: string;
}

export interface GapAutopsy {
  leaderId: string;
  leaderName: string;
  laggardId: string;
  laggardName: string;
  firstTenMillionGapDay: string | null;
  opening: PairMoment;
  midpoint: PairMoment;
  closing: PairMoment;
  midpointContributions: GapContribution[];
  closingContributions: GapContribution[];
  initialPotentialPoints: { leader: number; laggard: number };
}

export interface ResilienceScores {
  resilience: number;
  equality: number;
  merit: number;
  liquidity: number;
  practicality: number;
  overall: number;
}

export interface SeasonRecoveryAnalysis {
  config: ResilienceConfig;
  shock: ShockConfig;
  result: RecoveryResult;
  historicalResult: RecoveryResult;
  scores: ResilienceScores;
  deltaRecoveryProbability: number;
  assumptions: string[];
}

export interface ResilienceRecommendation {
  id: 'resilience' | 'balanced' | 'merit';
  name: string;
  description: string;
  config: ResilienceConfig;
  scores: ResilienceScores;
  averageRecoveryProbability: number;
  worstCaseRecoveryProbability: number;
  averageLockInProbability: number;
  runnerUp: ResilienceConfig;
  modelVersion: RecoveryResult['modelVersion'];
  simulationCount: number;
}

export interface SeasonReviewQualityV2 {
  rawFinanceRows: number;
  uniqueFinanceEvents: number;
  transfers: number;
  bids: number;
  transfersWithBids: number;
  marketSnapshotDays: number;
  marketCoverageStart: string | null;
  balanceSnapshots: false;
  salaryHistory: false;
  warnings: string[];
}

export interface SimulationCalibrationReport {
  observedTransfers: number;
  simulatedMedianTransactions: number;
  transferRelativeError: number;
  observedFinalResourceGini: number;
  simulatedFinalResourceGini: number;
  resourceGiniAbsoluteError: number;
  observedFinalSquadGini: number;
  simulatedFinalSquadGini: number;
  squadGiniAbsoluteError: number;
  status: 'strong' | 'acceptable' | 'weak';
}

export interface SeasonReviewOverviewV2 {
  version: 2;
  seasonId: typeof REVIEW_SEASON_ID;
  startingBudget: number;
  openingRosterSize: number;
  users: Array<{ id: string; name: string; color: string }>;
  timeline: HistoricalTimelinePoint[];
  autopsy: GapAutopsy;
  capDiagnostics: RosterCapDiagnostic[];
  recommendations: ResilienceRecommendation[];
  historicalConfig: ResilienceConfig;
  defaultShock: ShockConfig;
  initialAnalysis: SeasonRecoveryAnalysis;
  simulationCalibration: SimulationCalibrationReport;
  quality: SeasonReviewQualityV2;
  generatedAt: string;
}
