import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import type { CurrentMarketListing } from '../models/market-catalogue';

const state = vi.hoisted(() => ({
  index: 0,
  values: new Map<number, unknown>(),
  setters: [] as ReturnType<typeof vi.fn>[],
  cards: vi.fn(),
  modal: vi.fn(),
}));
vi.mock('react', async (load) => ({
  ...(await load<typeof import('react')>()),
  useState: (initial: unknown) => {
    const index = state.index++;
    const setter = vi.fn();
    state.setters[index] = setter;
    return [state.values.has(index) ? state.values.get(index) : initial, setter];
  },
}));
vi.mock('@/components/layout', () => ({
  Section: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
vi.mock('@/components/ui/card-variants/ElegantCard', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/CustomSelect', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  LayoutGroup: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./MarketPlayerCard', () => ({
  default: (props: { player: CurrentMarketListing }) => {
    state.cards(props);
    return <article data-player={props.player.player_id} />;
  },
}));
vi.mock('./ExpandedPlayerModal', () => ({
  default: (props: { player: CurrentMarketListing }) => {
    state.modal(props);
    return <aside />;
  },
}));
import MarketListingsSection from './MarketListingsSection';

const listing = (id: number, extra: Partial<CurrentMarketListing> = {}): CurrentMarketListing => ({
  player_id: id,
  name: `Player ${id}`,
  img: null,
  position: 'Base',
  team_id: 1,
  team: 'Alpha',
  team_img: null,
  real_price: null,
  recent_scores: null,
  min_points: null,
  max_points: null,
  games_played: null,
  seller_id: null,
  seller_name: 'Mercado',
  seller_icon: null,
  seller_color: null,
  next_opponent_id: null,
  next_opponent_name: null,
  next_opponent_img: null,
  next_match_date: null,
  player_team: null,
  price: 100,
  price_trend: 0,
  avg_recent_points: 0,
  value_score: id,
  total_points: 0,
  season_avg: 0,
  recommendation_score: 0,
  recommendation_label: '',
  recommendation_color: '',
  recommendation_dot: '',
  recommendation_icon: '',
  ...extra,
});
const render = (rows?: CurrentMarketListing[]) =>
  renderToStaticMarkup(<MarketListingsSection listings={rows} />);
const ids = () => state.cards.mock.calls.map(([props]) => props.player.player_id);
beforeEach(() => {
  state.index = 0;
  state.values.clear();
  state.setters = [];
  vi.clearAllMocks();
});

it('keeps omitted and empty listings invisible', () => {
  expect(render()).toBe('');
  state.index = 0;
  expect(render([])).toBe('');
});
it('sorts descending without mutating the source and retains stable ties', () => {
  const rows = [listing(1), listing(2, { value_score: 1 }), listing(3)];
  render(rows);
  expect(ids()).toEqual([3, 1, 2]);
  expect(rows.map((row) => row.player_id)).toEqual([1, 2, 3]);
});
it.each([
  'recommendation_score',
  'value_score',
  'total_points',
  'price',
  'price_trend',
  'avg_recent_points',
] as const)('supports ascending %s', (key) => {
  state.values.set(5, key);
  state.values.set(6, 'asc');
  render([listing(1, { [key]: 3 }), listing(2, { [key]: 1 })]);
  expect(ids()).toEqual([2, 1]);
});
it.each([
  ['free', [1, 2, 3]],
  ['owned', [4]],
] as const)('preserves %s ownership precedence', (owner, expected) => {
  state.values.set(0, owner);
  render([
    listing(1, { seller_name: null, seller_id: '7' }),
    listing(2, { seller_name: 'Mercado', seller_id: '7' }),
    listing(3, { seller_name: 'Manager', seller_id: null }),
    listing(4, { seller_name: 'Manager', seller_id: '7' }),
  ]);
  expect(ids().sort()).toEqual(expected);
});
it('combines exact position/team, parseInt price and trimmed case-insensitive name filters', () => {
  state.values.set(1, 'Base');
  state.values.set(2, 'Alpha');
  state.values.set(3, '100.9');
  state.values.set(4, '  PLAYER  ');
  render([
    listing(1),
    listing(2, { position: 'Alero' }),
    listing(3, { team: 'Beta' }),
    listing(4, { price: 101 }),
    listing(5, { name: 'Other' }),
  ]);
  expect(ids()).toEqual([1]);
});
it('retains no-results text and current null-name failure only when searching', () => {
  state.values.set(4, 'missing');
  expect(render([listing(1)])).toContain('No hay resultados');
  state.index = 0;
  expect(() => render([listing(1, { name: null })])).toThrow(TypeError);
  state.index = 0;
  state.values.set(4, '');
  expect(() => render([listing(1, { name: null })])).not.toThrow();
});
it('forwards the exact listing and preserves expansion/selection callbacks', () => {
  const row = listing(1);
  state.values.set(7, 1);
  state.values.set(8, row);
  render([row]);
  const props = state.cards.mock.calls[0][0];
  expect(props.player).toBe(row);
  expect(props.isExpanded).toBe(true);
  props.onToggleExpand();
  expect(state.setters[7]).toHaveBeenCalledWith(null);
  props.onExpandLevel2();
  expect(state.setters[8]).toHaveBeenCalledWith(row);
  expect(state.modal.mock.calls[0][0].player).toBe(row);
  state.modal.mock.calls[0][0].onClose();
  expect(state.setters[8]).toHaveBeenLastCalledWith(null);
});
