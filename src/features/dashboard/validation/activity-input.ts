import { validateNumber } from '@/lib/utils/validation';

/** Keep parseInt, first duplicate, empty-as-absent and numeric bounds unchanged. */
export function parseActivityUserId(
  params: URLSearchParams
): { valid: true; value: string | null } | { valid: false } {
  const input = params.get('userId');
  if (!input) return { valid: true, value: null };
  const parsed = validateNumber(input, { min: 1, max: 999999999 });
  return parsed.valid ? { valid: true, value: String(parsed.value) } : { valid: false };
}
