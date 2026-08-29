import { describe, expect, it } from 'vitest';

import { compareTransferValue } from './transfer-value';

describe('transfer value comparison', () => {
  it('treats buying below market value as a saving', () => {
    expect(
      compareTransferValue({
        transactionPrice: 2_700_000,
        marketValue: 3_000_000,
        sellerIsMarket: true,
        buyerIsMarket: false,
      })
    ).toEqual({
      difference: -300_000,
      percentage: -10,
      assessment: 'saving',
      tone: 'positive',
    });
  });

  it('treats buying above market value as an overprice', () => {
    expect(
      compareTransferValue({
        transactionPrice: 3_600_000,
        marketValue: 3_000_000,
        sellerIsMarket: true,
        buyerIsMarket: false,
      })
    ).toEqual({
      difference: 600_000,
      percentage: 20,
      assessment: 'overpay',
      tone: 'negative',
    });
  });

  it('uses the seller perspective when a manager sells to the market', () => {
    expect(
      compareTransferValue({
        transactionPrice: 3_300_000,
        marketValue: 3_000_000,
        sellerIsMarket: false,
        buyerIsMarket: true,
      })
    ).toMatchObject({
      difference: 300_000,
      percentage: 10,
      assessment: 'favorable_sale',
      tone: 'positive',
    });
  });

  it('uses the buyer perspective for manager-to-manager transfers', () => {
    expect(
      compareTransferValue({
        transactionPrice: 2_700_000,
        marketValue: 3_000_000,
        sellerIsMarket: false,
        buyerIsMarket: false,
      })
    ).toMatchObject({ assessment: 'saving', tone: 'positive' });
  });

  it('returns a neutral comparison when transaction and market value match', () => {
    expect(
      compareTransferValue({
        transactionPrice: 3_000_000,
        marketValue: 3_000_000,
        sellerIsMarket: true,
        buyerIsMarket: false,
      })
    ).toEqual({
      difference: 0,
      percentage: 0,
      assessment: 'at_market',
      tone: 'neutral',
    });
  });

  it.each([null, 0])('does not estimate when market value is %s', (marketValue) => {
    expect(
      compareTransferValue({
        transactionPrice: 3_000_000,
        marketValue,
        sellerIsMarket: true,
        buyerIsMarket: false,
      })
    ).toEqual({
      difference: null,
      percentage: null,
      assessment: 'unavailable',
      tone: 'unavailable',
    });
  });
});
