export interface LineupOfferPlayer {
  owner?: { price?: number | null } | null;
  price?: number | null;
}

export interface LineupOfferPrice {
  amount?: number | null;
}

export interface LineupOfferProjection {
  purchasePrice: number;
  offerAmount: number | null | undefined;
  currentPrice: number;
  marketValue: number | null | undefined;
  totalProfit: number;
  profitActual: number;
  marketDiff: number;
  profitPercent: string | 0;
  marketDiffPercent: string;
}

/** Client-side projection preserving the existing offer views' financial conventions.
 * Unknown purchase prices count as zero. Table/ranking market prices default to zero;
 * cards retain the raw market value, including NaN/Infinity percentage behavior.
 */
export function projectLineupOffer(
  player: LineupOfferPlayer,
  offer: LineupOfferPrice
): LineupOfferProjection {
  const purchasePrice = player.owner?.price || 0;
  const offerAmount = offer.amount;
  const currentPrice = player.price || 0;
  const marketValue = player.price;
  const totalProfit = Number(offerAmount) - purchasePrice;
  const profitActual = Number(offerAmount) - currentPrice;
  const marketDiff = Number(offerAmount) - Number(marketValue);
  return {
    purchasePrice,
    offerAmount,
    currentPrice,
    marketValue,
    totalProfit,
    profitActual,
    marketDiff,
    profitPercent: purchasePrice > 0 ? ((totalProfit / purchasePrice) * 100).toFixed(1) : 0,
    marketDiffPercent: ((marketDiff / Number(marketValue)) * 100).toFixed(1),
  };
}
