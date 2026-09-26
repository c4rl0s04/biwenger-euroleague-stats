import { describe, expect, it } from 'vitest';
import {
  validateSellPlayerInput,
  validateSellAllInput,
  validateWithdrawPlayerInput,
  validateAcceptOfferInput,
  validateRejectOfferInput,
  MarketCommandValidationError,
} from '../validation/market-command.schema';

describe('Market Command Schemas & Validation', () => {
  describe('validateSellPlayerInput', () => {
    it('validates and parses valid sell player input', () => {
      const valid = validateSellPlayerInput({
        playerId: 123,
        price: 5000000,
        type: 'sell',
      });
      expect(valid).toEqual({
        playerId: 123,
        price: 5000000,
        type: 'sell',
      });
    });

    it('defaults type to "sell" when omitted', () => {
      const valid = validateSellPlayerInput({
        playerId: '123',
        price: '4000',
      });
      expect(valid).toEqual({
        playerId: 123,
        price: 4000,
        type: 'sell',
      });
    });

    it('accepts immediateSell type', () => {
      const valid = validateSellPlayerInput({
        playerId: 456,
        price: 1000,
        type: 'immediateSell',
      });
      expect(valid.type).toBe('immediateSell');
    });

    it('throws MarketCommandValidationError on missing or non-positive playerId', () => {
      expect(() => validateSellPlayerInput({ price: 1000 })).toThrow(MarketCommandValidationError);
      expect(() => validateSellPlayerInput({ playerId: 0, price: 1000 })).toThrow(
        MarketCommandValidationError
      );
      expect(() => validateSellPlayerInput({ playerId: -5, price: 1000 })).toThrow(
        MarketCommandValidationError
      );
    });

    it('throws MarketCommandValidationError on negative price or invalid type', () => {
      expect(() => validateSellPlayerInput({ playerId: 1, price: -10 })).toThrow(
        MarketCommandValidationError
      );
      expect(() =>
        validateSellPlayerInput({ playerId: 1, price: 100, type: 'invalid' as any })
      ).toThrow(MarketCommandValidationError);
    });
  });

  describe('validateSellAllInput', () => {
    it('defaults pricePercentage to 100 when empty', () => {
      expect(validateSellAllInput({})).toEqual({ pricePercentage: 100 });
      expect(validateSellAllInput(undefined)).toEqual({ pricePercentage: 100 });
    });

    it('validates custom percentage within bounds', () => {
      expect(validateSellAllInput({ pricePercentage: 95 })).toEqual({ pricePercentage: 95 });
      expect(validateSellAllInput({ pricePercentage: '110' })).toEqual({ pricePercentage: 110 });
    });

    it('rejects values outside allowed percentage bounds', () => {
      expect(() => validateSellAllInput({ pricePercentage: 0 })).toThrow(
        MarketCommandValidationError
      );
      expect(() => validateSellAllInput({ pricePercentage: 600 })).toThrow(
        MarketCommandValidationError
      );
    });
  });

  describe('validateWithdrawPlayerInput', () => {
    it('validates valid playerId', () => {
      expect(validateWithdrawPlayerInput({ playerId: 77 })).toEqual({ playerId: 77 });
      expect(validateWithdrawPlayerInput({ playerId: '88' })).toEqual({ playerId: 88 });
    });

    it('throws on missing or invalid playerId', () => {
      expect(() => validateWithdrawPlayerInput({})).toThrow(MarketCommandValidationError);
      expect(() => validateWithdrawPlayerInput({ playerId: -1 })).toThrow(
        MarketCommandValidationError
      );
      expect(() => validateWithdrawPlayerInput(null)).toThrow(MarketCommandValidationError);
    });
  });

  describe('validateAcceptOfferInput', () => {
    it('validates offerId without playerId', () => {
      expect(validateAcceptOfferInput({ offerId: 50 })).toEqual({ offerId: 50 });
      expect(validateAcceptOfferInput({ offerId: '50' })).toEqual({ offerId: 50 });
    });

    it('validates offerId with optional playerId', () => {
      expect(validateAcceptOfferInput({ offerId: 50, playerId: 12 })).toEqual({
        offerId: 50,
        playerId: 12,
      });
      expect(validateAcceptOfferInput({ offerId: '50', playerId: '12' })).toEqual({
        offerId: 50,
        playerId: 12,
      });
    });

    it('throws on missing offerId', () => {
      expect(() => validateAcceptOfferInput({})).toThrow(MarketCommandValidationError);
      expect(() => validateAcceptOfferInput({ offerId: 0 })).toThrow(MarketCommandValidationError);
    });
  });

  describe('validateRejectOfferInput', () => {
    it('validates offerId', () => {
      expect(validateRejectOfferInput({ offerId: 99 })).toEqual({ offerId: 99 });
      expect(validateRejectOfferInput({ offerId: '99' })).toEqual({ offerId: 99 });
    });

    it('throws on missing or non-positive offerId', () => {
      expect(() => validateRejectOfferInput({})).toThrow(MarketCommandValidationError);
      expect(() => validateRejectOfferInput({ offerId: -1 })).toThrow(MarketCommandValidationError);
    });
  });
});
