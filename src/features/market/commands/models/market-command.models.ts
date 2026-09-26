export interface SellPlayerInput {
  playerId: number;
  price: number;
  type?: 'sell' | 'immediateSell';
}

export interface SellPlayerResult {
  status: 'completed';
  playerId: number;
  mode: 'sell' | 'immediateSell';
  message: string;
}

export interface SellAllInput {
  pricePercentage?: number;
}

export interface SellAllResult {
  status: 'completed';
  message: string;
}

export interface WithdrawPlayerInput {
  playerId: number;
}

export interface WithdrawPlayerResult {
  status: 'completed';
  playerId: number;
  message?: string;
}

export interface AcceptOfferInput {
  offerId: number;
  playerId?: number;
}

export interface AcceptOfferResult {
  status: 'completed';
  offerId: number;
  playerId?: number;
  message?: string;
}

export interface RejectOfferInput {
  offerId: number;
}

export interface RejectOfferResult {
  status: 'completed';
  offerId: number;
  message?: string;
}
