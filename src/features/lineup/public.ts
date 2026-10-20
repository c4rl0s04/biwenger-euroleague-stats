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

export { projectLineupOffer } from './logic/offer-projection';
export type {
  LineupOfferPlayer,
  LineupOfferPrice,
  LineupOfferProjection,
} from './logic/offer-projection';

export { default as LineupClient } from './components/LineupClient';
export { default as MobileLineupClient } from './screens/MobileLineupClient';
export { default as MobileOffersClient } from './screens/MobileOffersClient';
export { default as AutoAlignButton } from './components/AutoAlignButton';
export { default as LineupSectionScreen } from './screens/LineupSectionScreen';
export type { LineupSectionModel } from './models/section';
