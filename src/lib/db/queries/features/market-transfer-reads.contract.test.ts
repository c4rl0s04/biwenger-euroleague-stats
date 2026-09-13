import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const dependencies = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('../../index', () => ({ pgClient: { query: dependencies.query }, db: {} }));
vi.mock('@/lib/db/client', () => ({ db: { query: dependencies.query } }));
vi.mock('../../season-context', () => ({ resolveReadSeasonId: dependencies.season }));
vi.mock('../core/teams', () => ({}));
vi.mock('../core/playerForm', () => ({}));
import {
  getLiveMarketTransfers,
  getBestValueDetails,
  getBiddingDuelDetails,
  getAllTransfers,
  getMarketTrends,
  getMarketKPIs,
} from './market';

beforeEach(() => {
  vi.resetAllMocks();
  dependencies.season.mockResolvedValue('fixture-season');
});

it('preserves basic transfer defaults, null fields and daily trend normalization', async () => {
  const row = {
    id: 9,
    fecha: null,
    player_id: null,
    precio: null,
    vendedor: null,
    comprador: 'Fixture',
  };
  dependencies.query
    .mockResolvedValueOnce({ rows: [row] })
    .mockResolvedValueOnce({ rows: [{ date: null, count: '2', avg_value: null }] });
  expect(await getAllTransfers()).toEqual([row]);
  expect(await getMarketTrends()).toEqual([{ date: null, count: 2, avg_value: 0 }]);
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    [100, 0, 'fixture-season'],
    ['fixture-season'],
  ]);
});

it('preserves KPI rounding and empty-query fallback', async () => {
  dependencies.query
    .mockResolvedValueOnce({
      rows: [
        {
          total_transfers: '2',
          avg_value: '3.25',
          max_value: '7',
          min_value: null,
          active_buyers: '1',
          active_sellers: '0',
        },
      ],
    })
    .mockResolvedValueOnce({ rows: [] });
  expect(await getMarketKPIs()).toEqual({
    total_transfers: 2,
    avg_value: 3.25,
    max_value: 7,
    min_value: 0,
    active_buyers: 1,
    active_sellers: 0,
  });
  expect(await getMarketKPIs()).toEqual({
    total_transfers: 0,
    avg_value: 0,
    max_value: 0,
    min_value: 0,
    active_buyers: 0,
    active_sellers: 0,
  });
});

it('preserves transfer filters as bound values and keeps the paginated envelope', async () => {
  const row = {
    id: 1,
    fecha: null,
    precio: '107',
    vendedor: null,
    comprador: 'Fixture',
    vendedor_id: '',
    vendedor_icon: null,
    vendedor_color_index: null,
    comprador_id: '007',
    comprador_icon: null,
    comprador_color_index: 2,
    player_id: null,
    player_name: null,
    player_position: null,
    player_img: null,
    player_team: null,
    bids_count: '3',
  };
  dependencies.query
    .mockResolvedValueOnce({ rows: [row] })
    .mockResolvedValueOnce({ rows: [{ total: '5' }] });
  expect(
    await getLiveMarketTransfers({ page: 2, limit: 3, buyer: "O'Brien%", seller: 'Seller_' })
  ).toEqual({
    transfers: [{ ...row, precio: 107, bids_count: 3, vendedor_id: null }],
    total: 5,
    page: 2,
    totalPages: 2,
  });
  expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
    ['fixture-season', "O'Brien%", 'Seller_', 3, 3],
    ['fixture-season', "O'Brien%", 'Seller_'],
  ]);
  expect(dependencies.query.mock.calls[0][0]).not.toContain("O'Brien");
});

it.each(['all', 'Todos'])(
  'keeps the %s filter sentinel and internal 20-row default',
  async (filter) => {
    dependencies.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });
    expect(await getLiveMarketTransfers({ buyer: filter, seller: filter })).toEqual({
      transfers: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
    expect(dependencies.query.mock.calls.map((call) => call[1])).toEqual([
      ['fixture-season', 20, 0],
      ['fixture-season'],
    ]);
  }
);

it('preserves ownership-window details and JSON date serialization', async () => {
  dependencies.query.mockResolvedValue({
    rows: [
      {
        round_name: null,
        date: new Date('2026-01-02T13:00:00Z'),
        points: '8.9',
        opponent: null,
        team_id: null,
      },
    ],
  });
  expect(JSON.parse(JSON.stringify(await getBestValueDetails(0)))).toEqual([
    {
      round_name: null,
      date: '2026-01-02T13:00:00.000Z',
      points: 8,
      opponent: null,
      team_id: null,
    },
  ]);
  expect(dependencies.query).toHaveBeenCalledExactlyOnceWith(expect.any(String), [
    0,
    'fixture-season',
  ]);
});

it('preserves duel ID truncation, nullable fields and numeric mapping', async () => {
  dependencies.query.mockResolvedValue({
    rows: [
      {
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
      },
    ],
  });
  expect(await getBiddingDuelDetails(7.9, 8.1)).toEqual([
    {
      transfer_id: 9,
      transfer_date: null,
      player_id: 3,
      player_name: null,
      player_img: null,
      winner_id: 7,
      winner_name: 'Winner',
      winner_icon: null,
      winner_color_index: null,
      runner_id: 8,
      runner_name: 'Runner',
      runner_icon: null,
      runner_color_index: 2,
      winning_bid: 105,
      second_bid: 100,
      margin: 5,
    },
  ]);
  expect(dependencies.query).toHaveBeenCalledExactlyOnceWith(expect.any(String), [
    'fixture-season',
    '7',
    '8',
  ]);
});

it('propagates a failed count read rather than inventing a transfer total', async () => {
  dependencies.query
    .mockResolvedValueOnce({ rows: [] })
    .mockRejectedValueOnce(new Error('fixture count failure'));
  await expect(getLiveMarketTransfers({})).rejects.toThrow('fixture count failure');
});
