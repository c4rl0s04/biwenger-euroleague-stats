export type {
  SafeIdentifier,
  SafeLineupConfig,
  SafeLineupPlayerOwner,
  SafeLineupPlayer,
  SafeMarketListingPlayer,
  SafeMarketListing,
  SafeLineupOffer,
  SafeLineupResponse,
  LineupCommandInput,
  LineupCommandResult,
} from './models/lineup';

export {
  parseFormation,
  calculatePerfScore,
  realignTactics,
  performSwap,
  normalizeLineupConfig,
  deriveRotation,
} from './logic/lineup';
export type {
  TacticalPlayer,
  TacticalLineup,
  NormalizedLineup,
  LineupNormalizationInput,
} from './logic/lineup';

export { buildAutoLineup } from './logic/auto-lineup';
export { rankSwapCandidates, calculateSquadFormAverage, enrichLineupSquad } from './logic/squad';
export type { AutoAlignPlayer, AutoAlignMatch } from './logic/auto-lineup';
