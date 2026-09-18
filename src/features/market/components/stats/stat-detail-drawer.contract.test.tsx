import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import type {
  MarketDrawerConfig,
  MarketDrawerProps,
  MarketDrawerRowProps,
} from '../../models/market-drawer';
import type { MarketAnalytics } from '../../models/market-analytics';

const fake = vi.hoisted(() => ({ selected: null as string | null, config: vi.fn() }));
vi.mock('react', async (load) => {
  const actual = await load<typeof import('react') & { default: typeof import('react') }>();
  return {
    ...actual,
    default: {
      ...actual.default,
      useState: (initial: unknown) => [
        typeof initial === 'boolean' ? initial : fake.selected,
        vi.fn(),
      ],
    },
  };
});
vi.mock('react-dom', () => ({ createPortal: (children: ReactNode) => children }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));
vi.mock('@/components/ui/PlayerImage', () => ({ default: () => null }));
vi.mock('@/components/ui/Tooltip', () => ({ TooltipHeader: () => null }));
vi.mock('./renderers/registry', () => ({ getMetricConfig: fake.config }));
vi.mock('./renderers/PlayerStatRow', () => ({
  default: (props: MarketDrawerRowProps) => <pre data-kind="player">{JSON.stringify(props)}</pre>,
}));
vi.mock('./renderers/UserStatRow', () => ({
  default: (props: MarketDrawerRowProps) => <pre data-kind="user">{JSON.stringify(props)}</pre>,
}));
vi.mock('./renderers/TransactionStatRow', () => ({
  default: (props: MarketDrawerRowProps) => (
    <pre data-kind="transaction">{JSON.stringify(props)}</pre>
  ),
}));
vi.mock('./renderers/TemporalStatRow', () => ({
  default: (props: MarketDrawerRowProps) => <pre data-kind="temporal">{JSON.stringify(props)}</pre>,
}));
import StatDetailDrawer from './StatDetailDrawer';

const managers = [
  { id: '7', name: 'Synthetic Alpha', icon: null, color_index: 0 },
  { id: '8', name: 'Synthetic Beta', icon: null, color_index: 1 },
];
const flips: MarketAnalytics['bestFlip'] = [7, 8].map((id) => ({
  user_id: String(id),
  user_name: `Manager ${id}`,
  user_color_index: 0,
  player_id: id + 10,
  player_name: `Player ${id}`,
  player_img: null,
  purchase_price: 100,
  sale_price: 100 + id,
  profit: id,
}));
const render = (config: MarketDrawerConfig) =>
  renderToStaticMarkup(
    <StatDetailDrawer {...config} isOpen onClose={() => {}} allUsers={managers} />
  );

beforeEach(() => {
  vi.resetAllMocks();
  fake.selected = null;
  vi.stubGlobal('document', { body: {} });
});
afterEach(() => vi.unstubAllGlobals());

it('retains SSR no-document and closed drawer behavior', () => {
  vi.unstubAllGlobals();
  expect(render({ title: 'Test', statType: 'temporal', data: flips })).toBe('');
  vi.stubGlobal('document', { body: {} });
  expect(
    renderToStaticMarkup(
      <StatDetailDrawer title="Test" statType="player" isOpen={false} onClose={() => {}} />
    )
  ).toBe('');
});

it('keeps empty-state text and skips summary lookup with no rows', () => {
  const html = render({ title: 'Test', statType: 'player', data: [] });
  expect(html).toContain('No hay datos disponibles para este ranking.');
  expect(fake.config).not.toHaveBeenCalled();
});

it('keeps global ranking indices while filtering by exact manager identity', () => {
  fake.selected = '8';
  const html = render({ title: 'Test', statType: 'temporal', data: flips });
  expect(html).not.toContain('Player 7');
  expect(html).toContain('Player 8');
  expect(html).toContain('&quot;globalIdx&quot;:1');
  expect(html).toContain('&quot;localIdx&quot;:0');
  expect(flips[1]).not.toHaveProperty('globalIndex');
});

it('preserves name fallback and no-coercion identity behavior', () => {
  fake.selected = '7';
  const data = [{ ...flips[0], user_id: 'other', user_name: managers[0].name }];
  expect(render({ title: 'Test', statType: 'temporal', data })).toContain('Player 7');
  fake.selected = 'unknown';
  expect(render({ title: 'Test', statType: 'temporal', data })).toContain(
    'No hay datos disponibles'
  );
});

it('keeps summary key callbacks, first-row labels and selected totals', () => {
  fake.config.mockReturnValue({
    summary: {
      key: (item: MarketAnalytics['bestFlip'][number]) => item.profit,
      label: () => 'Synthetic total',
      type: 'currency',
    },
  });
  fake.selected = '8';
  const html = render({ title: 'Test', statType: 'temporal', data: flips });
  expect(fake.config).toHaveBeenCalledWith(expect.objectContaining({ player_id: 18 }), 'TEMPORAL');
  expect(html).toContain('Synthetic total');
  expect(html).toContain('+8');
});

it('keeps temporal renderer selection for holding and flip records', () => {
  const html = render({ title: 'Test', statType: 'temporal', data: flips });
  expect(html).toContain('data-kind="temporal"');
  expect(html).not.toContain('data-kind="player"');
});

it('keeps user totals on the manager renderer and hides manager filtering', () => {
  const html = render({
    title: 'Test',
    statType: 'user',
    data: [
      {
        name: 'Synthetic Alpha',
        user_id: '7',
        user_color_index: 0,
        total_spent: 10,
        purchases_count: 1,
      },
    ],
  });
  expect(html).toContain('data-kind="user"');
  expect(html).not.toContain('Todos los Managers');
});

it('keeps player ranking dispatch and manager owner-name fallback', () => {
  fake.selected = '7';
  const html = render({
    title: 'Test',
    statType: 'player',
    data: [
      {
        player_id: 17,
        name: 'Synthetic Player',
        img: null,
        player_team: null,
        transfer_count: 2,
        avg_price: 30,
        owner_id: null,
        owner_name: 'Synthetic Alpha',
        owner_color_index: 0,
      },
    ],
  });
  expect(html).toContain('data-kind="player"');
  expect(html).toContain('Synthetic Player');
});

it('keeps transaction renderer and strict numeric-ID comparison before name fallback', () => {
  const transaction: MarketAnalytics['recordTransfer'][number] = {
    id: 7,
    season_id: null,
    timestamp: null,
    fecha: null,
    player_id: 17,
    precio: 20,
    vendedor: 'Seller',
    comprador: 'Buyer',
    player_name: 'Synthetic Transaction',
    player_img: null,
    player_team: null,
    team_name: null,
    team_logo: null,
    buyer_id: null,
    buyer_name: null,
    buyer_icon: null,
    buyer_color: null,
    seller_id: null,
    seller_name: null,
    seller_icon: null,
    seller_color: null,
  };
  expect(render({ title: 'Test', statType: 'transaction', data: [transaction] })).toContain(
    'data-kind="transaction"'
  );
  fake.selected = '7';
  expect(render({ title: 'Test', statType: 'transaction', data: [transaction] })).not.toContain(
    'Synthetic Transaction'
  );
  expect(
    render({
      title: 'Test',
      statType: 'transaction',
      data: [{ ...transaction, comprador: 'Synthetic Alpha' }],
    })
  ).toContain('Synthetic Transaction');
});

it('keeps string-key summary aggregation and row-count footer', () => {
  fake.config.mockReturnValue({
    summary: { key: 'profit', label: 'Synthetic sum', type: 'number' },
  });
  const html = render({ title: 'Test', statType: 'temporal', data: flips });
  expect(html).toContain('Synthetic sum');
  expect(html).toContain('>15<');
  expect(html).toContain('Registros');
});

// Compile-time contract checks: categories cannot silently accept unrelated rows.
const accepted: MarketDrawerProps = {
  title: 'Test',
  statType: 'temporal',
  data: flips,
  isOpen: false,
  onClose: () => {},
};
// @ts-expect-error A flip is not a player-catalogue metric projection.
const rejected: MarketDrawerConfig = { title: 'Test', statType: 'player', data: flips };
void accepted;
void rejected;
