import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/market/server', () => ({
  getRecentTransfers: vi.fn(),
  getSignificantPriceChanges: vi.fn(),
}));
vi.mock('@/features/matches/server', () => ({
  getUpcomingFeedMatches: vi.fn(),
  getRecentFeedResults: vi.fn(),
}));
import { createNewsService, NEWS_READ_POLICY, type NewsDependencies } from './news.service';
import { mapTransfer, mapPriceChange, mapUpcomingMatch, mapResult } from '../mappers/news.mapper';
import { toMobileNewsItems } from '../../mappers/mobile-news.mapper';

const transfer = {
  id: 1,
  season_id: '2026',
  timestamp: '123',
  fecha: null,
  player_id: 7,
  precio: 200000,
  vendedor: null,
  comprador: 'Manager',
  player_name: 'Player',
  position: 'Base',
  vendedor_id: null,
  vendedor_color_index: null,
  comprador_id: null,
  comprador_color_index: null,
};
const price = {
  player_id: 7,
  name: 'Player',
  position: null,
  team: null,
  price: null,
  price_increment: 200000,
  owner_id: null,
};
const match = { id: 3, date: '2026-01-01T12:00:00.000Z', homeTeam: 'Home', awayTeam: 'Away' };
const fixture = (): NewsDependencies => ({
  transfers: vi.fn().mockResolvedValue([transfer]),
  prices: vi.fn().mockResolvedValue([price, { ...price, price_increment: -200000 }]),
  upcoming: vi.fn().mockResolvedValue([match]),
  results: vi.fn().mockResolvedValue([{ ...match, homeScore: 80, awayScore: 70 }]),
  now: vi.fn(() => 99),
  random: vi.fn(() => 0.5),
  reportError: vi.fn(),
});

describe('News service compatibility', () => {
  it('keeps already mapped items when a later row in a source throws', async () => {
    const d = fixture();
    const bad = {
      ...transfer,
      get precio(): number {
        throw new Error('Synthetic malformed row');
      },
    };
    vi.mocked(d.transfers).mockResolvedValue([transfer, bad]);
    const items = await createNewsService(d)();
    expect(items.filter((item) => item.type === 'transfer')).toHaveLength(1);
    expect(items.some((item) => item.type === 'result')).toBe(true);
    expect(d.reportError).toHaveBeenCalledOnce();
  });
  it('preserves source arguments, sequencing, five categories and random sort', async () => {
    const d = fixture();
    const items = await createNewsService(d)();
    expect(d.transfers).toHaveBeenCalledWith(5);
    expect(d.prices).toHaveBeenCalledWith(24, 200000);
    expect(d.upcoming).toHaveBeenCalledWith(3);
    expect(d.results).toHaveBeenCalledWith(3);
    expect(vi.mocked(d.transfers).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(d.prices).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(d.prices).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(d.upcoming).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(d.upcoming).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(d.results).mock.invocationCallOrder[0]
    );
    expect(items.map((i) => i.type)).toEqual([
      'transfer',
      'price_up',
      'price_down',
      'match',
      'result',
    ]);
    expect(d.random).toHaveBeenCalled();
    expect(d.now).toHaveBeenCalledTimes(2);
    expect(items[0]).toEqual({
      type: 'transfer',
      text: 'FICHAJE: Player (Base) pasa de Mercado a Manager por 200.000 €',
      timestamp: '123',
    });
    expect(items[1]).toEqual({
      type: 'price_up',
      text: 'MERCADO: Player sube 200.000 € hoy',
      timestamp: 99,
    });
    expect(items[2].text).toBe('MERCADO: Player baja 200.000 € hoy');
    expect(items[4].text).toBe('RESULTADO: Home 80 - 70 Away');
    for (const item of items)
      expect(Object.keys(item).sort()).toEqual(['text', 'timestamp', 'type']);
    expect(JSON.parse(JSON.stringify(items))).toEqual(items);
  });
  it.each(['transfers', 'prices', 'upcoming', 'results'] as const)(
    'isolates %s failure',
    async (key) => {
      const d = fixture();
      vi.mocked(d[key]).mockRejectedValue(new Error('Synthetic failure'));
      const items = await createNewsService(d)();
      expect(items.length).toBe(key === 'prices' ? 3 : 4);
      expect(d.reportError).toHaveBeenCalledOnce();
      expect(d.results).toHaveBeenCalled();
    }
  );
  it('keeps successful empty output when all sources fail', async () => {
    const d = fixture();
    for (const key of ['transfers', 'prices', 'upcoming', 'results'] as const)
      vi.mocked(d[key]).mockRejectedValue(new Error('Synthetic failure'));
    expect(await createNewsService(d)()).toEqual([]);
    expect(d.reportError).toHaveBeenCalledTimes(4);
  });
  it('does not cache repeated calls and accepts empty sources', async () => {
    const d = fixture();
    for (const key of ['transfers', 'prices', 'upcoming', 'results'] as const)
      vi.mocked(d[key]).mockResolvedValue([]);
    const service = createNewsService(d);
    expect(await service()).toEqual([]);
    expect(await service()).toEqual([]);
    expect(d.transfers).toHaveBeenCalledTimes(2);
    expect(NEWS_READ_POLICY).toMatchObject({
      identity: 'none',
      serverCache: 'none',
      httpMaxAge: 300,
      httpStaleWhileRevalidate: 60,
    });
  });
  it.each([123, '123', null])('preserves transfer timestamp %s', (timestamp) => {
    expect(mapTransfer({ ...transfer, timestamp }).timestamp).toBe(timestamp);
  });
  it('preserves null numeric coercion and nullable text behavior', () => {
    expect(
      mapTransfer({ ...transfer, precio: null, player_name: null, position: null, comprador: '' })
        .text
    ).toBe('FICHAJE: null (null) pasa de Mercado a Mercado por 0 €');
    expect(mapPriceChange({ ...price, price_increment: null }, () => 42)).toEqual({
      type: 'price_down',
      text: 'MERCADO: Player baja 0 € hoy',
      timestamp: 42,
    });
    expect(mapResult({ ...match, date: null, homeScore: null, awayScore: null })).toEqual({
      type: 'result',
      text: 'RESULTADO: Home null - null Away',
      timestamp: 0,
    });
  });
  it('preserves server-local Spanish date formatting', () => {
    const date = new Date(match.date);
    const day = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    expect(mapUpcomingMatch(match)).toEqual({
      type: 'match',
      text: `PRÓXIMO: Home vs Away (${day} ${time})`,
      timestamp: date.getTime(),
    });
  });
});

describe('mobile news projection', () => {
  it('preserves first-three, positional IDs, empty strings and fallbacks', () => {
    expect(
      toMobileNewsItems([
        { title: '', text: 'ignored', description: '', message: 'ignored' },
        { id: 7, text: 'Text', message: 'Message' },
        {},
        { title: 'fourth' },
      ])
    ).toEqual([
      { id: '0', title: '', description: '' },
      { id: '7', title: 'Text', description: 'Message' },
      { id: '2', title: 'Actualidad de la liga', description: '' },
    ]);
    expect(toMobileNewsItems([])).toEqual([]);
  });
});
