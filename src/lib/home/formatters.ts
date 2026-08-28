const oneDecimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function formatSpanishInteger(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function formatExactPoints(value: number): string {
  return `${formatSpanishInteger(value)} pts`;
}

export function formatExactMoney(value: number): string {
  return `${formatSpanishInteger(value)} €`;
}

export function formatCompactMoney(value: number): string {
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absoluteValue >= 1_000_000) {
    return `${sign}${oneDecimal.format(absoluteValue / 1_000_000)} M€`;
  }

  if (absoluteValue >= 1_000) {
    return `${sign}${oneDecimal.format(absoluteValue / 1_000)} mil €`;
  }

  return formatExactMoney(value);
}
