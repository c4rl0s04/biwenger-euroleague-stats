import type {
  SeasonSimulationDataset,
  SimulatedAgentProfile,
  SimulatedMarketListing,
  SimulatedSeasonPoint,
  SimulatedTransaction,
} from './simulation-types';
import type { ResilienceConfig } from './types';

export const EMERGENT_PAYOUT_AMOUNTS = [5_000, 7_500, 10_000, 12_500, 15_000, 17_500] as const;

export type EmergentPayoutAmount = (typeof EMERGENT_PAYOUT_AMOUNTS)[number];

export interface EmergentSimulationConfig extends ResilienceConfig {
  configId: string;
  payoutDirection: 'inverse';
  marketSlots: 20;
  eurosPerPoint: EmergentPayoutAmount;
}

export interface EmergentSeasonRequest {
  dataset: SeasonSimulationDataset;
  config: EmergentSimulationConfig;
  seed: number;
}

export interface EmergentRunDetail {
  version: 5;
  modelVersion: 'agent-season-v5';
  runId: string;
  seed: number;
  config: EmergentSimulationConfig;
  profiles: Array<{ userId: string; profile: SimulatedAgentProfile }>;
  timeline: SimulatedSeasonPoint[];
  transactions: SimulatedTransaction[];
  marketListings: SimulatedMarketListing[];
  catalogSize: number;
  openingForcedReleases: number;
}

export interface EmergentDistribution {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  quantiles: { p05: number; p25: number; p50: number; p75: number; p95: number };
  interval95: [number, number];
}

export interface EmergentRunSummary {
  runId: string;
  seed: number;
  finalResourceGini: number;
  finalSquadGini: number;
  finalResourceGap: number;
  finalPointsGap: number;
  resourceInequalityArea: number;
  resourceGapArea: number;
  roundToFiveMillionGap: number;
  roundToTenMillionGap: number;
  roundToTwentyMillionGap: number;
  competitive: {
    averageContenders: number;
    leadChanges: number;
    rankMobility: number;
  };
  naturalRecovery: {
    episodes: number;
    withinFiveRounds: number;
    withinTenRounds: number;
    withinTwentyRounds: number;
    bottomPersistenceFive: number;
    bottomPersistenceTen: number;
    bottomPersistenceTwenty: number;
  };
  antiHoarding: {
    topTalentConcentration: number;
    ownershipDiversity: number;
    benchTalentShare: number;
  };
  liquidity: {
    transactions: number;
    uniquePlayersTraded: number;
    marketCoverage: number;
    averageBidders: number;
    laggardAcquisitionShare: number;
  };
  merit: number;
  totalBonuses: number;
  openingForcedReleases: number;
  championProfileId: string;
}

export interface EmergentRunSample {
  summary: EmergentRunSummary;
  timeline: Array<{
    round: number;
    resourceGini: number;
    squadGini: number;
    resourceGap: number;
    pointsGap: number;
    titleContenders: number;
  }>;
}

export interface EmergentTimelineAggregate {
  round: number;
  resourceGini: EmergentDistribution;
  squadGini: EmergentDistribution;
  resourceGap: EmergentDistribution;
  pointsGap: EmergentDistribution;
  titleContenders: EmergentDistribution;
}

export interface EmergentConfigurationReport {
  version: 5;
  modelVersion: 'agent-season-v5';
  config: EmergentSimulationConfig;
  sampleSize: number;
  metrics: {
    finalResourceGini: EmergentDistribution;
    finalSquadGini: EmergentDistribution;
    finalResourceGap: EmergentDistribution;
    finalPointsGap: EmergentDistribution;
    resourceInequalityArea: EmergentDistribution;
    resourceGapArea: EmergentDistribution;
    naturalRecoveryTen: EmergentDistribution;
    bottomPersistenceTen: EmergentDistribution;
    topTalentConcentration: EmergentDistribution;
    ownershipDiversity: EmergentDistribution;
    benchTalentShare: EmergentDistribution;
    marketTransactions: EmergentDistribution;
    marketCoverage: EmergentDistribution;
    laggardAcquisitionShare: EmergentDistribution;
    averageContenders: EmergentDistribution;
    leadChanges: EmergentDistribution;
    rankMobility: EmergentDistribution;
    merit: EmergentDistribution;
    totalBonuses: EmergentDistribution;
    openingForcedReleases: EmergentDistribution;
  };
  timeline: EmergentTimelineAggregate[];
  runSummaries: EmergentRunSummary[];
}

export interface EmergentDimensionScores {
  economicEquality: number;
  competitiveBalance: number;
  naturalRecovery: number;
  antiHoarding: number;
  liquidity: number;
  merit: number;
  inflationControl: number;
  practicality: number;
}

export interface EmergentRankingEntry {
  rank: number;
  config: EmergentSimulationConfig;
  balanceScore: number;
  dimensions: EmergentDimensionScores;
  isParetoOptimal: boolean;
}

export interface EmergentCap15Comparison {
  comparedCap: number;
  sampleSize: number;
  probabilityLowerInequality: number;
  resourceInequalityDelta: EmergentDistribution;
  talentConcentrationDelta: EmergentDistribution;
  recoveryDelta: EmergentDistribution;
}

export interface EmergentCap15Analysis {
  eurosPerPoint: EmergentPayoutAmount;
  bestCap: number;
  cap15Rank: number;
  isTopThree: boolean;
  isParetoOptimal: boolean;
  balanceDeltaToBest: number;
  isRecommended: boolean;
  comparisons: EmergentCap15Comparison[];
}
