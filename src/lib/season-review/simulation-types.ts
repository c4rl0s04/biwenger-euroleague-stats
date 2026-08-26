import type { ResilienceConfig, ShockConfig, SimulationCalibrationReport } from './types';

export interface SimulationGridConfig extends ResilienceConfig {
  configId: string;
}

export type SimulationSeasonPhase = 'early' | 'first-third' | 'midseason';

export interface SimulationSeedManifestEntry {
  pairId: string;
  seed: number;
  shock: ShockConfig;
  phase: SimulationSeasonPhase;
}

export interface SeasonSimulationPlayer {
  id: string;
  position: string;
  initialPrice: number;
  roundPoints: number[];
  priceChanges: number[];
  initiallyEligible?: boolean;
}

export interface SeasonSimulationDataset {
  startingBudget: number;
  userCount: number;
  initialRosterSize: number;
  lineupSize: number;
  lineupPositionTargets: Record<string, number>;
  marketDaysPerRound: number;
  rounds: number[];
  players: SeasonSimulationPlayer[];
}

export interface SimulatedAgentProfile {
  id: string;
  marketActivity: number;
  bidAggression: number;
  pointsFocus: number;
  valueFocus: number;
  decisionNoise: number;
  lineupAccuracy: number;
}

export interface SimulatedRosterPlayer {
  playerId: string;
  position: string;
  price: number;
  projectedPoints: number;
}

export interface SimulatedUserSnapshot {
  userId: string;
  profileId: string;
  cash: number;
  squadValue: number;
  totalResources: number;
  squadPotential: number;
  competitiveStrength: number;
  rosterSize: number;
  rosterPlayerIds: string[];
  rosterPlayers: SimulatedRosterPlayer[];
  lineupPlayerIds: string[];
  roundPoints: number;
  points: number;
  bonuses: number;
  decisionQuality: number;
}

export interface SimulatedSeasonPoint {
  round: number;
  users: SimulatedUserSnapshot[];
  resourceGini: number;
  squadGini: number;
  titleContenders: number;
}

export interface SimulatedTransaction {
  round: number;
  marketDay: number;
  type: 'buy' | 'sell';
  userId: string;
  playerId: string;
  amount: number;
  marketValue: number;
}

export interface SimulatedMarketListing {
  round: number;
  marketDay: number;
  playerId: string;
  marketValue: number;
  bidCount: number;
  bids: Array<{
    userId: string;
    amount: number;
    replacementPlayerId: string | null;
  }>;
  sold: boolean;
  winnerUserId: string | null;
  winningAmount: number | null;
}

export interface SimulatedRecovery {
  targetUserId: string;
  economicRecovered: boolean;
  competitiveRecovered: boolean;
  recoveredAtRound: number | null;
  remainingEconomicGap: number;
  remainingCompetitiveGap: number;
}

export interface SeasonSimulationOutcome {
  seed: number;
  config: ResilienceConfig;
  shock: ShockConfig;
  profiles: Array<{ userId: string; profile: SimulatedAgentProfile }>;
  timeline: SimulatedSeasonPoint[];
  transactions: SimulatedTransaction[];
  marketListings: SimulatedMarketListing[];
  catalogSize: number;
  openingForcedReleases: number;
  recovery: SimulatedRecovery;
}

export interface SeasonSimulationRequest {
  dataset: SeasonSimulationDataset;
  config: ResilienceConfig;
  shock: ShockConfig;
  seed: number;
  shockEnabled?: boolean;
}

export interface PairedSeasonImpact {
  peakResourceLoss: number;
  resourceLossArea: number;
  peakCompetitiveLoss: number;
  competitiveLossArea: number;
  finalResourceLoss: number;
  finalCompetitiveLoss: number;
  finalPointsLoss: number;
  counterfactualRecovered: boolean;
  counterfactualRecoveredAtRound: number | null;
  absoluteRecovered: boolean;
}

export interface PairedSeasonOutcome {
  pairId: string;
  config: SimulationGridConfig;
  manifest: SimulationSeedManifestEntry;
  targetUserId: string;
  baseline: SeasonSimulationOutcome;
  shocked: SeasonSimulationOutcome;
  impact: PairedSeasonImpact;
}

export interface SimulationHistogramBin {
  start: number;
  end: number;
  count: number;
}

export interface SimulationDistribution {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  quantiles: {
    p05: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  histogram: SimulationHistogramBin[];
}

export interface SimulationProbabilityEstimate {
  value: number;
  interval95: [number, number];
  successes: number;
  total: number;
}

export interface SimulationScenarioAggregate {
  sampleSize: number;
  counterfactualRecovery: SimulationProbabilityEstimate;
  absoluteRecovery: SimulationProbabilityEstimate;
  peakResourceLoss: SimulationDistribution;
  recoveryRounds: SimulationDistribution;
}

export interface ConfigurationSimulationAggregate {
  config: SimulationGridConfig;
  sampleSize: number;
  metrics: {
    finalResourceGini: SimulationDistribution;
    finalSquadGini: SimulationDistribution;
    finalResourceGap: SimulationDistribution;
    finalPointsGap: SimulationDistribution;
    resourceInequalityArea: SimulationDistribution;
    resourceGapArea: SimulationDistribution;
    roundToFiveMillionGap: SimulationDistribution;
    roundToTenMillionGap: SimulationDistribution;
    roundToTwentyMillionGap: SimulationDistribution;
    productiveResourceShare: SimulationDistribution;
    resourceFuturePointsCorrelation: SimulationDistribution;
    openingSquadFinalPointsCorrelation: SimulationDistribution;
    squadInequalityArea: SimulationDistribution;
    midseasonContenders: SimulationDistribution;
    leadChanges: SimulationDistribution;
    rankMobility: SimulationDistribution;
    marketTransactions: SimulationDistribution;
    uniquePlayersTraded: SimulationDistribution;
    marketCoverage: SimulationDistribution;
    averageBidders: SimulationDistribution;
    unsoldListingRate: SimulationDistribution;
    marketVolume: SimulationDistribution;
    averageOverpay: SimulationDistribution;
    totalBonuses: SimulationDistribution;
    peakResourceLoss: SimulationDistribution;
    resourceLossArea: SimulationDistribution;
    peakCompetitiveLoss: SimulationDistribution;
    competitiveLossArea: SimulationDistribution;
    recoveryRounds: SimulationDistribution;
    skillOutcomeCorrelation: SimulationDistribution;
    openingForcedReleases: SimulationDistribution;
  };
  probabilities: {
    counterfactualRecovery: SimulationProbabilityEstimate;
    absoluteRecovery: SimulationProbabilityEstimate;
    recoveryWithinFiveRounds: SimulationProbabilityEstimate;
    recoveryWithinTenRounds: SimulationProbabilityEstimate;
    recoveryWithinTwentyRounds: SimulationProbabilityEstimate;
    lockIn: SimulationProbabilityEstimate;
    targetWinsTitle: SimulationProbabilityEstimate;
    targetFinishesPodium: SimulationProbabilityEstimate;
    targetFinishesLast: SimulationProbabilityEstimate;
    losesTitleOpportunity: SimulationProbabilityEstimate;
    losesPodiumOpportunity: SimulationProbabilityEstimate;
  };
  scenarios: Partial<Record<ShockConfig['kind'], SimulationScenarioAggregate>>;
  severities: Partial<Record<ShockConfig['severity'], SimulationScenarioAggregate>>;
  phases: Partial<Record<SimulationSeasonPhase, SimulationScenarioAggregate>>;
  championProfileEntropy: number;
}

export interface SimulationRunSample {
  shockKind: ShockConfig['kind'];
  shockSeverity: ShockConfig['severity'];
  phase: SimulationSeasonPhase;
  metrics: { [Key in keyof ConfigurationSimulationAggregate['metrics']]: number };
  counterfactualRecovered: boolean;
  absoluteRecovered: boolean;
  recoveryWithinFiveRounds: boolean;
  recoveryWithinTenRounds: boolean;
  recoveryWithinTwentyRounds: boolean;
  targetWinsTitle: boolean;
  targetFinishesPodium: boolean;
  targetFinishesLast: boolean;
  losesTitleOpportunity: boolean;
  losesPodiumOpportunity: boolean;
  championProfileId: string;
}

export interface SimulationDimensionScores {
  equality: number;
  competitiveness: number;
  resilience: number;
  merit: number;
  liquidity: number;
  inflationControl: number;
  practicality: number;
}

export type SimulationRankingProfileId =
  | 'equality'
  | 'competitive-balance'
  | 'resilience'
  | 'merit'
  | 'balanced';

export interface SimulationRankingEntry {
  rank: number;
  configId: string;
  config: SimulationGridConfig;
  score: number;
  dimensions: SimulationDimensionScores;
  isParetoOptimal: boolean;
  topTenProbability: number;
}

export interface SimulationProfileRanking {
  profileId: SimulationRankingProfileId;
  label: string;
  weights: SimulationDimensionScores;
  entries: SimulationRankingEntry[];
}

export interface SimulationRankingResult {
  paretoConfigIds: string[];
  profiles: SimulationProfileRanking[];
}

export type SimulationAnalysisStage = 'screen' | 'refine' | 'final';

export interface SimulationDatasetIdentity {
  seasonId: string;
  fingerprint: string;
  players: number;
  rounds: number;
  users: number;
}

export interface SimulationAnalysisShardArtifact {
  version: 4;
  kind: 'shard';
  modelVersion: 'agent-season-v4';
  stage: SimulationAnalysisStage;
  generatedAt: string;
  dataset: SimulationDatasetIdentity;
  pairCount: number;
  shardIndex: number;
  shardCount: number;
  configurationCount: number;
  aggregates: ConfigurationSimulationAggregate[];
}

export interface SimulationAnalysisArtifact {
  version: 4;
  kind: 'analysis';
  status: 'pending' | 'ready';
  modelVersion: 'agent-season-v4';
  stage: SimulationAnalysisStage | null;
  generatedAt: string | null;
  dataset: SimulationDatasetIdentity | null;
  pairCount: number;
  configurationCount: number;
  configurations: ConfigurationSimulationAggregate[];
  ranking: SimulationRankingResult | null;
  shortlistConfigIds: string[];
  calibration: SimulationCalibrationReport | null;
}

export interface SeasonMonteCarloResult {
  modelVersion: 'agent-season-v3';
  simulationCount: number;
  recoveryProbability: number;
  recoveryInterval95: [number, number];
  economicRecoveryProbability: number;
  competitiveRecoveryProbability: number;
  lockInProbability: number;
  medianRecoveryRounds: number;
  p90RecoveryRounds: number;
  medianRemainingEconomicGap: number;
  medianRemainingCompetitiveGap: number;
  medianFinalResourceGini: number;
  medianFinalSquadGini: number;
  medianMidseasonContenders: number;
  medianTransactions: number;
  medianPurchases: number;
  medianFinalResourceGap: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface MonteCarloOptions {
  runs: number;
  baseSeed?: number;
}

export interface SeasonSimulationArtifactEntry {
  config: ResilienceConfig;
  shock: ShockConfig;
  result: SeasonMonteCarloResult;
}

export interface SeasonSimulationArtifact {
  version: 3;
  status: 'pending' | 'ready';
  generatedAt: string | null;
  runsPerConfiguration: number;
  dataset: { players: number; rounds: number; users: number } | null;
  results: SeasonSimulationArtifactEntry[];
}
