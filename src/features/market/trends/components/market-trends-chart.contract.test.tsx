import { beforeEach, expect, it, vi } from 'vitest';
import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MarketTrendDay } from '../models/market-trends';

const fake = vi.hoisted(() => ({
  data: [] as MarketTrendDay[],
  loading: false,
  period: undefined as { label: string; days: number } | undefined,
  api: vi.fn(),
  chart: vi.fn(),
  active: true,
}));
vi.mock('react', async (load) => ({
  ...(await load<typeof import('react')>()),
  useState: (initial: unknown) => [fake.period ?? initial, vi.fn()],
}));
vi.mock('@/lib/hooks/useApiData', () => ({
  useApiData: (endpoint: () => string, options: unknown) => {
    fake.api(endpoint(), options);
    return { data: fake.data, loading: fake.loading };
  },
}));
vi.mock('@/components/ui/card-variants/ElegantCard', () => ({
  default: ({ children, actionRight }: { children: ReactNode; actionRight: ReactNode }) => (
    <section>
      {actionRight}
      {children}
    </section>
  ),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => children,
  AreaChart: ({ children, data }: { children: ReactNode; data: unknown }) => {
    fake.chart(data);
    return <div>{children}</div>;
  },
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: ({ content }: { content: ReactElement }) =>
    cloneElement(content as ReactElement<{ active: boolean; label: string; payload: unknown[] }>, {
      active: fake.active,
      label: 'Synthetic day',
      payload: [{ payload: fake.data[0] }],
    }),
}));
import MarketTrendsChart from './MarketTrendsChart';
const render = () => renderToStaticMarkup(<MarketTrendsChart />);
beforeEach(() => {
  vi.clearAllMocks();
  fake.data = [];
  fake.loading = false;
  fake.period = undefined;
  fake.active = true;
});

it.each([
  ['1W', 7],
  ['1M', 30],
  ['3M', 90],
  ['6M', 180],
  ['1Y', 365],
] as const)('preserves %s request/dependency/session-cache key', (label, days) => {
  fake.period = { label, days };
  render();
  expect(fake.api).toHaveBeenCalledWith(
    `/api/market/trends?days=${days}`,
    expect.objectContaining({ dependencies: [days], cacheKey: `market-trends-${days}` })
  );
  const options = fake.api.mock.calls[0][1];
  expect(Object.keys(options)).toEqual(['dependencies', 'cacheKey', 'transform']);
  expect(options.transform({ data: [] })).toEqual([]);
  const rows: MarketTrendDay[] = [];
  expect(options.transform(rows)).toBe(rows);
});
it('keeps default month, empty and loading branches', () => {
  expect(render()).toContain('No hay datos para este periodo.');
  expect(fake.api.mock.calls[0][0]).toBe('/api/market/trends?days=30');
  fake.loading = true;
  expect(render()).toContain('Cargando...');
  expect(fake.chart).not.toHaveBeenCalled();
});
it('preserves date projection, input order, summed volume and tooltip price thresholds', () => {
  fake.data = [
    {
      date: '2020-01-02',
      volume: 1500000,
      avg_price: 0,
      ops_count: 4,
      transfers: [
        { player_name: 'Large', price: 1000000 },
        { player_name: 'Medium', price: 1500 },
        { player_name: 'Small', price: 999 },
        { player_name: null, price: null },
      ],
    },
    { date: '2020-01-01', volume: 2000000, avg_price: 0, ops_count: 0, transfers: [] },
  ];
  const html = render();
  expect(html).toContain('3.5');
  expect(html).toContain('1.50');
  expect(html).toContain('1.0M');
  expect(html).toContain('2k');
  expect(html).toContain('999');
  expect(fake.chart.mock.calls[0][0]).toEqual(
    fake.data.map((row) => ({
      ...row,
      shortDate: new Date(row.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      }),
    }))
  );
  expect(fake.data[0]).not.toHaveProperty('shortDate');
});
it('preserves inactive and empty-transfer tooltip behavior', () => {
  fake.data = [{ date: '2020-01-01', volume: 0, avg_price: 0, ops_count: 0, transfers: [] }];
  expect(render()).toContain('Sin fichajes');
  fake.active = false;
  expect(render()).not.toContain('Synthetic day');
});
