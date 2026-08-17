import type { ResilienceConfig, ShockConfig } from './types';

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
  marketDaysPerRound: number;
  rounds: number[];
  players: SeasonSimulationPlayer[];
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
  points: number;
  bonuses: number;
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
  timeline: SimulatedSeasonPoint[];
  transactions: SimulatedTransaction[];
  recovery: SimulatedRecovery;
}

export interface SeasonSimulationRequest {
  dataset: SeasonSimulationDataset;
  config: ResilienceConfig;
  shock: ShockConfig;
  seed: number;
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
