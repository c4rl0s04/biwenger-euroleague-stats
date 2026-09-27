import { describe, expect, it } from 'vitest';
import { projectLineupOffer } from './offer-projection';

describe('Lineup offer financial projection', () => {
  it('projects investment profit and market difference separately', () => {
    expect(projectLineupOffer({ owner: { price: 80 }, price: 90 }, { amount: 100 })).toEqual({
      purchasePrice: 80,
      offerAmount: 100,
      currentPrice: 90,
      marketValue: 90,
      totalProfit: 20,
      profitActual: 10,
      marketDiff: 10,
      profitPercent: '25.0',
      marketDiffPercent: '11.1',
    });
  });
  it('preserves losses and negative percentages', () => {
    const result = projectLineupOffer({ owner: { price: 100 }, price: 80 }, { amount: 60 });
    expect(result.totalProfit).toBe(-40);
    expect(result.profitPercent).toBe('-40.0');
    expect(result.marketDiffPercent).toBe('-25.0');
  });
  it.each([undefined, null, 0, -10])(
    'keeps the non-positive purchase-price ROI fallback for %s',
    (price) => {
      const result = projectLineupOffer({ owner: { price }, price: 10 }, { amount: 20 });
      expect(result.purchasePrice).toBe(price || 0);
      expect(result.profitPercent).toBe(0);
    }
  );
  it('preserves missing ownership and the card/table distinction for absent market prices', () => {
    const result = projectLineupOffer({}, { amount: 10 });
    expect(result.purchasePrice).toBe(0);
    expect(result.totalProfit).toBe(10);
    expect(result.currentPrice).toBe(0);
    expect(result.profitActual).toBe(10);
    expect(result.marketValue).toBeUndefined();
    expect(result.marketDiff).toBeNaN();
    expect(result.marketDiffPercent).toBe('NaN');
  });
  it.each([null, 0])('preserves zero-market percentage output for %s', (price) => {
    expect(projectLineupOffer({ price }, { amount: 10 }).marketDiffPercent).toBe('Infinity');
    expect(projectLineupOffer({ price }, { amount: 0 }).marketDiffPercent).toBe('NaN');
  });
  it('retains absent and null offer amounts without silently replacing them for display', () => {
    expect(projectLineupOffer({}, {}).offerAmount).toBeUndefined();
    expect(projectLineupOffer({}, {}).totalProfit).toBeNaN();
    expect(projectLineupOffer({}, { amount: null }).offerAmount).toBeNull();
    expect(projectLineupOffer({}, { amount: null }).totalProfit).toBe(0);
  });
  it('preserves one-decimal percentage rounding', () => {
    expect(projectLineupOffer({ owner: { price: 1000 } }, { amount: 1000.49 }).profitPercent).toBe(
      '0.0'
    );
    expect(projectLineupOffer({ owner: { price: 1000 } }, { amount: 1000.51 }).profitPercent).toBe(
      '0.1'
    );
  });
  it('does not mutate source data', () => {
    const player = Object.freeze({ owner: Object.freeze({ price: 10 }), price: 20 });
    const offer = Object.freeze({ amount: 30 });
    expect(projectLineupOffer(player, offer).totalProfit).toBe(20);
    expect(player.owner.price).toBe(10);
    expect(offer.amount).toBe(30);
  });
});
