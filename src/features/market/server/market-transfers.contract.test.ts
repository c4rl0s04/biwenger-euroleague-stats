import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
const dependencies = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { query: dependencies.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: dependencies.season }));
import { auth } from '@/auth';
import { GET as transfers } from '@/app/api/market/transfers/route';
import {
  GET as valueDetails,
  dynamic as valueDynamic,
} from '@/app/api/market/stats/value-details/route';
import { GET as duelDetails, dynamic as duelDynamic } from '@/app/api/market/duels/details/route';
import { getLiveMarketTransfers, getBestValueDetails, getBiddingDuelDetails } from '../server';
import {
  parseMarketReadId,
  parseMarketDuelIds,
  parseMarketTransferParams,
} from '../validation/market-transfers';
import {
  mapMarketTransfer,
  mapMarketValueDetail,
  mapMarketDuelDetail,
} from './mappers/market-transfers.mapper';

const transfer = {
  id: 9,
  fecha: null,
  precio: '105',
  vendedor: null,
  comprador: 'Fixture',
  vendedor_id: '',
  vendedor_icon: null,
  vendedor_color_index: null,
  comprador_id: '007',
  comprador_icon: 'fixture.png',
  comprador_color_index: 2,
  player_id: 3,
  player_name: null,
  player_position: null,
  player_img: null,
  player_team: null,
  bids_count: '2',
};
const value = {
  round_name: null,
  date: new Date('2026-01-02T13:00:00Z'),
  points: '9.9',
  opponent: null,
  team_id: 7,
};
const duel = {
  transfer_id: '9',
  transfer_date: null,
  player_id: '3',
  player_name: null,
  player_img: null,
  winner_id: '007',
  winner_name: 'Winner',
  winner_icon: null,
  winner_color_index: null,
  runner_id: '008',
  runner_name: 'Runner',
  runner_icon: null,
  runner_color_index: '2',
  winning_bid: '105',
  second_bid: '100',
  margin: '5',
};
const request = (path: string, cookie?: string) =>
  new NextRequest(`https://fixture.invalid/api/market/${path}`, {
    headers: cookie ? { cookie: `fixture=${cookie}` } : {},
  });

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.season.mockResolvedValue('fixture-season');
});

it('allowlists every output while preserving nullable fields, identity forms and dates', () => {
  const transferRecord = Object.freeze({ ...transfer, internal_field: 'not exposed' });
  expect(mapMarketTransfer(transferRecord)).toEqual({
    ...transfer,
    precio: 105,
    bids_count: 2,
    vendedor_id: null,
  });
  const valueRecord = { ...value, internal_field: 'not exposed' };
  expect(mapMarketValueDetail(valueRecord)).toEqual({
    ...value,
    date: '2026-01-02T13:00:00.000Z',
    points: 9,
  });
  const duelRecord = { ...duel, internal_field: 'not exposed' };
  expect(mapMarketDuelDetail(duelRecord)).toEqual({
    ...duel,
    transfer_id: 9,
    player_id: 3,
    winner_id: 7,
    runner_id: 8,
    runner_color_index: 2,
    winning_bid: 105,
    second_bid: 100,
    margin: 5,
  });
  expect(transferRecord.comprador_id).toBe('007');
});

it('does not convert malformed numeric aggregates into fabricated zeros', () => {
  expect(
    JSON.parse(
      JSON.stringify(mapMarketTransfer({ ...transfer, precio: 'invalid', bids_count: 'invalid' }))
    )
  ).toMatchObject({ precio: null, bids_count: null });
  expect(mapMarketValueDetail({ ...value, date: null }).date).toBeNull();
});

it('keeps detail routes dynamic', () => {
  expect(valueDynamic).toBe('force-dynamic');
  expect(duelDynamic).toBe('force-dynamic');
});

it.each([null, ''])(
  'preserves missing ID %s as zero without weakening literal zero validation',
  (input) => {
    expect(parseMarketReadId(input)).toEqual({ valid: true, value: 0 });
    expect(parseMarketReadId('0')).toEqual({ valid: false, error: 'Value must be at least 1' });
  }
);

it.each([
  ['7abc', { valid: true, value: 7 }],
  ['8.9', { valid: true, value: 8 }],
  ['abc', { valid: false, error: 'Invalid numeric value' }],
  ['9007199254740992', { valid: false, error: 'Value must be at most 9007199254740991' }],
])('preserves detail input %s', (input, expected) => {
  expect(parseMarketReadId(input as string)).toEqual(expected);
});

it('preserves duel validation precedence and one-missing-ID behavior', () => {
  expect(parseMarketDuelIds(null, null)).toEqual({
    valid: false,
    error: 'Users must be different',
  });
  expect(parseMarketDuelIds(null, '7')).toEqual({
    valid: true,
    value: { userId: 0, opponentId: 7 },
  });
  expect(parseMarketDuelIds('7abc', '7.9')).toEqual({
    valid: false,
    error: 'Users must be different',
  });
  expect(parseMarketDuelIds('0', 'invalid')).toEqual({
    valid: false,
    error: 'Value must be at least 1',
  });
});

it('preserves HTTP transfer defaults, prefix parsing, first values and trimming', () => {
  expect(parseMarketTransferParams(new URLSearchParams())).toEqual({
    valid: true,
    value: { page: 1, limit: 10, buyer: undefined, seller: undefined },
  });
  expect(
    parseMarketTransferParams(
      new URLSearchParams('page=2abc&page=4&limit=3.9&buyer=%20A%25%20&seller=%20')
    )
  ).toEqual({ valid: true, value: { page: 2, limit: 3, buyer: 'A%', seller: undefined } });
});

it.each([
  ['page=0&limit=invalid', 'Value must be at least 1'],
  ['page=1001', 'Value must be at most 1000'],
  ['limit=101', 'Value must be at most 100'],
  ['limit=invalid', 'Invalid numeric value'],
])('preserves paging rejection for %s', (input, error) => {
  expect(parseMarketTransferParams(new URLSearchParams(input))).toEqual({ valid: false, error });
});

it('serves the real transfer handler from mapped records with the original cache and envelope', async () => {
  dependencies.query
    .mockResolvedValueOnce({ rows: [{ ...transfer, internal_field: 'not exposed' }] })
    .mockResolvedValueOnce({ rows: [{ total: '5' }] });
  const response = await transfers(request('transfers?page=2abc&limit=3.9&buyer=%20A%25%20'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe(
    'public, max-age=60, stale-while-revalidate=60'
  );
  expect(await response.json()).toEqual({
    success: true,
    data: {
      transfers: [{ ...transfer, precio: 105, bids_count: 2, vendedor_id: null }],
      total: 5,
      page: 2,
      totalPages: 2,
    },
  });
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    ['fixture-season', 'A%', 3, 3],
    ['fixture-season', 'A%'],
  ]);
});

it('preserves detail JSON and cache policies through the real handlers', async () => {
  dependencies.query
    .mockResolvedValueOnce({ rows: [value] })
    .mockResolvedValueOnce({ rows: [duel] });
  const valueResponse = await valueDetails(request('stats/value-details'));
  expect(valueResponse.status).toBe(200);
  expect(valueResponse.headers.get('cache-control')).toBe(
    'public, max-age=300, stale-while-revalidate=60'
  );
  expect(await valueResponse.json()).toEqual({
    success: true,
    data: [{ ...value, date: '2026-01-02T13:00:00.000Z', points: 9 }],
  });
  const duelResponse = await duelDetails(request('duels/details?opponentId=7'));
  expect(duelResponse.status).toBe(200);
  expect(duelResponse.headers.get('cache-control')).toBe(
    'public, max-age=60, stale-while-revalidate=60'
  );
  expect(await duelResponse.json()).toEqual({
    success: true,
    data: [
      {
        ...duel,
        transfer_id: 9,
        player_id: 3,
        winner_id: 7,
        runner_id: 8,
        runner_color_index: 2,
        winning_bid: 105,
        second_bid: 100,
        margin: 5,
      },
    ],
  });
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    [0, 'fixture-season'],
    ['fixture-season', '0', '7'],
  ]);
});

it('does not use viewer identity or introduce request caching', async () => {
  dependencies.query.mockResolvedValue({ rows: [value] });
  const first = await valueDetails(request('stats/value-details?transferId=9', 'viewer-A'));
  const second = await valueDetails(request('stats/value-details?transferId=9', 'viewer-B'));
  expect(await first.json()).toEqual(await second.json());
  expect(auth).not.toHaveBeenCalled();
  expect(dependencies.season).toHaveBeenCalledTimes(2);
  expect(dependencies.query).toHaveBeenCalledTimes(2);
});

it.each([
  [transfers, 'transfers?page=0'],
  [valueDetails, 'stats/value-details?transferId=abc'],
  [duelDetails, 'duels/details?userId=7&opponentId=7'],
] as const)('rejects invalid route input before reads', async (handler, path) => {
  const response = await handler(request(path));
  expect(response.status).toBe(400);
  expect(response.headers.get('cache-control')).toBe(
    'private, no-store, max-age=0, must-revalidate'
  );
  expect(dependencies.season).not.toHaveBeenCalled();
  expect(dependencies.query).not.toHaveBeenCalled();
});

it.each([
  [transfers, 'transfers', 'Failed to fetch transfers'],
  [valueDetails, 'stats/value-details?transferId=9', 'Failed to fetch details'],
  [duelDetails, 'duels/details?userId=7&opponentId=8', 'Failed to fetch duel details'],
] as const)(
  'keeps failures private with generic response messages',
  async (handler, path, message) => {
    dependencies.query.mockRejectedValue(new Error('fixture internal failure'));
    const response = await handler(request(path));
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
    expect(await response.json()).toEqual({ success: false, error: message });
  }
);

it('preserves empty details and propagates missing count results', async () => {
  dependencies.query.mockResolvedValue({ rows: [] });
  expect(await getBestValueDetails(9)).toEqual([]);
  expect(await getBiddingDuelDetails(7, 8)).toEqual([]);
  await expect(getLiveMarketTransfers({})).rejects.toThrow();
});
