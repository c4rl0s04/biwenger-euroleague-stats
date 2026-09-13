import { validateNumber, type ValidationResult } from '@/lib/utils/validation';
import type { MarketTransfersInput } from '../models/market-transfers';

/** Missing values deliberately retain the legacy default zero despite min: 1. */
export function parseMarketReadId(value: string | null): ValidationResult<number> {
  return validateNumber(value, { min: 1, max: Number.MAX_SAFE_INTEGER });
}

export function parseMarketDuelIds(
  user: string | null,
  opponent: string | null
): ValidationResult<{ userId: number; opponentId: number }> {
  const userId = parseMarketReadId(user);
  const opponentId = parseMarketReadId(opponent);
  if (!userId.valid) return userId;
  if (!opponentId.valid) return opponentId;
  if (userId.value === opponentId.value) return { valid: false, error: 'Users must be different' };
  return { valid: true, value: { userId: userId.value, opponentId: opponentId.value } };
}

export function parseMarketTransferParams(
  params: URLSearchParams
): ValidationResult<MarketTransfersInput> {
  const page = validateNumber(params.get('page'), { defaultValue: 1, min: 1, max: 1000 });
  const limit = validateNumber(params.get('limit'), { defaultValue: 10, min: 1, max: 100 });
  if (!page.valid) return page;
  if (!limit.valid) return limit;
  return {
    valid: true,
    value: {
      page: page.value,
      limit: limit.value,
      buyer: params.get('buyer')?.trim() || undefined,
      seller: params.get('seller')?.trim() || undefined,
    },
  };
}
