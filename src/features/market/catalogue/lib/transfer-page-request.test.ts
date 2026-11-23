import { expect, it } from 'vitest';
import { buildTransferPageRequest } from './transfer-page-request';

it('separates cached transfers for a season round trip with identical filters', () => {
  const filters = { buyer: 'Ana & Luis', seller: '' };
  const first = buildTransferPageRequest('2025-26', 2, filters);
  const second = buildTransferPageRequest('2026-27', 2, filters);
  const returnToFirst = buildTransferPageRequest('2025-26', 2, filters);

  expect(first.endpoint).toBe('/api/market/transfers?page=2&limit=8&buyer=Ana+%26+Luis');
  expect(second.endpoint).toBe(first.endpoint);
  expect(first.cacheKey).toBe('market-transfers:2025-26:page=2&limit=8&buyer=Ana+%26+Luis');
  expect(second.cacheKey).toBe('market-transfers:2026-27:page=2&limit=8&buyer=Ana+%26+Luis');
  expect(returnToFirst).toEqual(first);
});

it('does not cache a transfer page when the season is unknown', () => {
  expect(buildTransferPageRequest(undefined, 1, { buyer: '', seller: '' }).cacheKey).toBeNull();
});
