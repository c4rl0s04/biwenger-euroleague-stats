/**
 * Formats a number into a Euro currency string with optional compact notation (k, M).
 *
 * @param {number | null | undefined} value - The numeric value to format
 * @param {boolean} compact - Whether to use 1.2M, 50k notation
 * @returns {string} Formatted string
 */
export function formatEuro(value: number | null | undefined, compact: boolean = true): string {
  if (value === null || value === undefined) return '0';

  const abs = Math.abs(value);
  let result = '';

  if (compact) {
    if (abs >= 1000000) {
      result = (abs / 1000000).toFixed(1) + 'M';
    } else if (abs >= 1000) {
      result = (abs / 1000).toFixed(0) + 'k';
    } else {
      result = abs.toLocaleString('es-ES');
    }
  } else {
    result = abs.toLocaleString('es-ES');
  }

  return result;
}

/**
 * Formats a profit/loss value with a sign (+/-)
 *
 * @param {number | null | undefined} value - The numeric value to format
 * @returns {string} Formatted string with sign
 */
export function formatProfit(value: number | null | undefined): string {
  if (value === null || value === undefined) return '+0 €';
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${formatEuro(value)} €`;
}
