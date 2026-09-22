export type TransferValueAssessment =
  | 'saving'
  | 'overpay'
  | 'favorable_sale'
  | 'below_market_sale'
  | 'at_market'
  | 'unavailable';

export type TransferValueTone = 'positive' | 'negative' | 'neutral' | 'unavailable';

export interface TransferValueComparison {
  difference: number | null;
  percentage: number | null;
  assessment: TransferValueAssessment;
  tone: TransferValueTone;
}

interface CompareTransferValueInput {
  transactionPrice: number;
  marketValue: number | null;
  sellerIsMarket: boolean;
  buyerIsMarket: boolean;
}

export function compareTransferValue({
  transactionPrice,
  marketValue,
  sellerIsMarket,
  buyerIsMarket,
}: CompareTransferValueInput): TransferValueComparison {
  if (marketValue === null || !Number.isFinite(marketValue) || marketValue <= 0) {
    return {
      difference: null,
      percentage: null,
      assessment: 'unavailable',
      tone: 'unavailable',
    };
  }

  const difference = transactionPrice - marketValue;
  const percentage = (difference / marketValue) * 100;

  if (difference === 0) {
    return { difference, percentage, assessment: 'at_market', tone: 'neutral' };
  }

  // A manager-to-manager transfer is assessed from the buyer's perspective.
  if (!buyerIsMarket) {
    return difference < 0
      ? { difference, percentage, assessment: 'saving', tone: 'positive' }
      : { difference, percentage, assessment: 'overpay', tone: 'negative' };
  }

  if (!sellerIsMarket) {
    return difference > 0
      ? { difference, percentage, assessment: 'favorable_sale', tone: 'positive' }
      : { difference, percentage, assessment: 'below_market_sale', tone: 'negative' };
  }

  return { difference, percentage, assessment: 'at_market', tone: 'neutral' };
}
