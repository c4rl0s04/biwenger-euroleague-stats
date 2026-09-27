/** Provider-dated daily prices. An absent date is never synthesized. */
export interface HistoricalPrice {
  date: string;
  price: number;
}

export interface PriceHistoryBounds {
  startsAt: string;
  endsAt: string | null;
}

export interface PriceHistoryCounts {
  inserted: number;
  corrected: number;
  unchanged: number;
}

export const PRICE_HISTORY_CHECKPOINT_PREFIX = 'biwenger-price-history:v1:';
export const PRICE_HISTORY_REFRESH_MS = 24 * 60 * 60 * 1000;

export function isCalendarDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function validatePriceHistoryBounds(bounds: PriceHistoryBounds): void {
  if (
    !isCalendarDate(bounds.startsAt) ||
    (bounds.endsAt !== null && (!isCalendarDate(bounds.endsAt) || bounds.endsAt < bounds.startsAt))
  ) {
    throw new Error('Price history requires valid season date boundaries.');
  }
}

export function priceHistoryCheckpointKey(seasonId: string, playerId: number): string {
  return `${PRICE_HISTORY_CHECKPOINT_PREFIX}${seasonId}:${playerId}`;
}

export function priceHistoryBoundsKey(bounds: PriceHistoryBounds): string {
  return JSON.stringify([bounds.startsAt, bounds.endsAt]);
}

export function priceHistoryIsFresh(
  checkedAt: string | null,
  checkpointBounds: string | null,
  bounds: PriceHistoryBounds,
  now: Date
): boolean {
  if (!checkedAt || checkpointBounds !== priceHistoryBoundsKey(bounds)) return false;
  const age = now.getTime() - Date.parse(checkedAt);
  return Number.isFinite(age) && age >= 0 && age < PRICE_HISTORY_REFRESH_MS;
}

/** Validate the complete response before any writes, including duplicate dates and player identity. */
export function parsePlayerPriceHistory(
  response: unknown,
  playerId: number,
  bounds: PriceHistoryBounds,
  today: string
): HistoricalPrice[] {
  validatePriceHistoryBounds(bounds);
  if (!isCalendarDate(today)) throw new Error('Invalid price history cutoff.');
  const data = (response as { data?: { id?: unknown; prices?: unknown } } | null)?.data;
  if (
    (typeof data?.id !== 'number' && typeof data?.id !== 'string') ||
    Number(data.id) !== playerId ||
    !Array.isArray(data.prices)
  ) {
    throw new Error('Invalid player price history response.');
  }
  const prices = new Map<string, number>();
  for (const entry of data.prices) {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new Error('Invalid daily price entry.');
    }
    const [rawDate, rawPrice] = entry;
    const value = String(rawDate);
    const date = `20${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`;
    if (!/^\d{6}$/.test(value) || !isCalendarDate(date)) {
      throw new Error('Invalid daily price date.');
    }
    if (date < bounds.startsAt || (bounds.endsAt && date > bounds.endsAt) || date > today) {
      continue;
    }
    // PostgreSQL integer price column, in euros; zero is a valid provider price.
    if (
      (typeof rawPrice !== 'number' && typeof rawPrice !== 'string') ||
      String(rawPrice).trim() === '' ||
      !Number.isInteger(Number(rawPrice)) ||
      Number(rawPrice) < 0 ||
      Number(rawPrice) > 2_147_483_647
    ) {
      throw new Error('Invalid daily price amount.');
    }
    const price = Number(rawPrice);
    if (prices.has(date) && prices.get(date) !== price) {
      throw new Error('Conflicting provider prices for the same date.');
    }
    prices.set(date, price);
  }
  return Array.from(prices)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, price]) => ({ date, price }));
}
