export type SafeIdentifier = string | number;

export interface SafeLineupConfig {
  type?: string;
  playersID: SafeIdentifier[];
  reservesID: SafeIdentifier[];
  captain?: SafeIdentifier;
  striker?: SafeIdentifier;
  coach?: SafeIdentifier;
  date?: SafeIdentifier;
}

export interface SafeLineupPlayerOwner {
  price?: number;
}

export interface SafeLineupPlayer {
  id?: SafeIdentifier;
  owner?: SafeLineupPlayerOwner | null;
}

export interface SafeMarketListingPlayer {
  id?: SafeIdentifier;
}

export interface SafeMarketListing {
  id?: SafeIdentifier;
  playerID?: SafeIdentifier;
  player?: SafeMarketListingPlayer | null;
  price?: number;
}

export interface SafeLineupOffer {
  id?: SafeIdentifier;
  amount?: number;
  until?: number;
  requestedPlayers: SafeIdentifier[];
}

export interface SafeLineupResponse {
  lineup: SafeLineupConfig | null;
  players: SafeLineupPlayer[];
  market: SafeMarketListing[];
  offers: SafeLineupOffer[];
}

export interface BiwengerUserLineupData {
  type?: string;
  playersID?: unknown;
  reservesID?: unknown;
  captain?: unknown;
  striker?: unknown;
  coach?: unknown;
  date?: unknown;
  [key: string]: unknown;
}

export interface BiwengerUserPlayerData {
  id?: unknown;
  owner?: {
    price?: unknown;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface BiwengerUserMarketData {
  id?: unknown;
  playerID?: unknown;
  player?: {
    id?: unknown;
    [key: string]: unknown;
  } | null;
  price?: unknown;
  [key: string]: unknown;
}

export interface BiwengerUserOfferData {
  id?: unknown;
  amount?: unknown;
  until?: unknown;
  requestedPlayers?: unknown;
  [key: string]: unknown;
}

export interface BiwengerUserData {
  lineup?: BiwengerUserLineupData | null;
  players?: BiwengerUserPlayerData[];
  market?: BiwengerUserMarketData[];
  offers?: BiwengerUserOfferData[];
  [key: string]: unknown;
}

export interface LineupCommandInput {
  type?: string;
  playersID: SafeIdentifier[];
  reservesID?: SafeIdentifier[];
  captain?: SafeIdentifier | null;
  striker?: SafeIdentifier | null;
  coach?: SafeIdentifier | null;
}

export interface LineupCommandResult {
  status: 'completed';
  message: string;
}
