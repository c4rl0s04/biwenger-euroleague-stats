import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MarketAnalytics } from '../models/market-analytics';
import type { MarketDrawerState } from '../models/market-drawer';

const fake = vi.hoisted(() => ({
  loading: false,
  data: undefined as Partial<MarketAnalytics> | undefined,
  index: 0,
  values: [] as unknown[],
  api: vi.fn(),
  props: new Map<string, Record<string, unknown>>(),
}));
vi.mock('react', async (load) => ({
  ...(await load<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = fake.index++;
    if (!(index in fake.values)) fake.values[index] = initial;
    return [
      fake.values[index],
      (value: unknown) => {
        fake.values[index] = typeof value === 'function' ? value(fake.values[index]) : value;
      },
    ];
  },
}));
vi.mock('@/lib/hooks/useApiData', () => ({
  useApiData: (endpoint: string) => {
    fake.api(endpoint);
    return { data: fake.data, loading: fake.loading };
  },
}));

// Render the real orchestration, replacing only its leaf visual components. Discover
// literal relative imports so a newly added leaf cannot silently load legacy JSX here.
const source = readFileSync(
  resolve(process.cwd(), 'src/features/market/components/MarketPageClient.tsx'),
  'utf8'
);
const leaf = (name: string) =>
  function MockMarketLeaf(props: Record<string, unknown>) {
    fake.props.set(name, props);
    return createElement('section', null, props.children as ReactNode);
  };
for (const match of Array.from(source.matchAll(/^import (\w+) from '(\.\/[^']+)';/gm))) {
  vi.doMock(match[2], () => ({ default: leaf(match[1]) }));
}
vi.doMock('@/components/ui/card-variants/ElegantCard', () => ({ default: leaf('ElegantCard') }));
vi.doMock('@/components/ui/Subheading', () => ({ default: leaf('Subheading') }));
vi.doMock('@/components/layout', () => ({ Section: leaf('Section') }));
let MarketPageClient: typeof import('./MarketPageClient').default;
beforeAll(async () => {
  MarketPageClient = (await import('./MarketPageClient')).default;
});
const render = () => {
  fake.index = 0;
  return renderToStaticMarkup(<MarketPageClient />);
};
beforeEach(() => {
  vi.clearAllMocks();
  fake.loading = false;
  fake.data = undefined;
  fake.index = 0;
  fake.values = [];
  fake.props.clear();
});

it('retains the aggregate URL and loading skeleton without rendering leaves', () => {
  fake.loading = true;
  expect(render()).toContain('animate-pulse');
  expect(fake.api).toHaveBeenCalledWith('/api/market/stats');
  expect(fake.props.size).toBe(0);
});
it('preserves the missing-data fallback and legacy component calls', () => {
  render();
  expect(fake.props.get('MarketListingsSection')).toEqual({ listings: undefined });
  expect(fake.props.get('MarketTrendsChart')).toEqual({ trends: undefined });
  expect(fake.props.get('LiveMarketTable')).toEqual({});
  expect(fake.props.get('Subheading')).toHaveProperty('title');
  expect(fake.props.get('Subheading')).toHaveProperty('subtitle');
});
it('forwards exact listing, chart and manager projections without remapping', () => {
  fake.data = { currentMarketListings: [], trends: [], allUsers: [], managerStats: [] };
  render();
  expect(fake.props.get('MarketListingsSection')?.listings).toBe(fake.data.currentMarketListings);
  expect(fake.props.get('MarketTrendsChart')?.trends).toBe(fake.data.trends);
  expect(fake.props.get('ManagerFinancesTable')?.data).toBe(fake.data.managerStats);
  expect(fake.props.get('StatDetailDrawer')?.allUsers).toBe(fake.data.allUsers);
});
it('preserves category-specific drawer configuration and close without discarding data', () => {
  fake.data = { bestFlip: [], allUsers: [] };
  render();
  (fake.props.get('BestFlipCard')?.onViewAll as () => void)();
  const state = fake.values[1] as MarketDrawerState;
  expect(state).toMatchObject({ isOpen: true, title: 'El Pelotazo', statType: 'temporal' });
  expect(state.data).toBe(fake.data.bestFlip);
  render();
  const drawer = fake.props.get('StatDetailDrawer')!;
  expect(drawer.data).toBe(fake.data.bestFlip);
  expect(drawer.statType).toBe('temporal');
  (drawer.onClose as () => void)();
  expect(fake.values[1]).toEqual({ ...state, isOpen: false });
});
