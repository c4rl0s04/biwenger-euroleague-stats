/**
 * Format price to M€ (e.g., 6.52 M€)
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (!price) return '0 €';
  const val = typeof price === 'string' ? parseFloat(price) : price;
  return (val / 1000000).toFixed(2) + ' M€';
}

/**
 * Format currency to full Euro (e.g., 9.380.000 €)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (!value) return '0 €';
  const val = typeof value === 'string' ? parseFloat(value) : value;
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val) + ' €'
  );
}
