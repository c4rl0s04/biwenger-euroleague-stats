import { validateNumber, type ValidationResult } from '@/lib/utils/validation';

/** Preserve the existing HTTP selector, including permissive numeric parsing. */
export function parseMarketTrendDays(value: string | null): ValidationResult<number> {
  const result = validateNumber(value, { defaultValue: 30, min: 1, max: 365 });
  if (!result.valid) return result;
  return [7, 30, 90, 180, 365].includes(result.value)
    ? result
    : { valid: false, error: 'Invalid days parameter' };
}
