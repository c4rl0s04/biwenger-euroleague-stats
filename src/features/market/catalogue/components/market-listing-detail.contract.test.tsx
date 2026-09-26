import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import type { MarketListingPresentation } from '../models/market-listing-presentation';

const fake = vi.hoisted(() => ({
  mounted: true,
  details: undefined as unknown,
  loading: false,
  api: vi.fn(),
}));
vi.mock('react', async (load) => ({
  ...(await load<typeof import('react')>()),
  useState: () => [fake.mounted, vi.fn()],
}));
vi.mock('react-dom', () => ({ createPortal: (children: ReactNode) => children }));
vi.mock('@/lib/hooks/useApiData', () => ({
  useApiData: (endpoint: () => string, options: { skip: boolean }) => {
    fake.api(endpoint(), options);
    return { data: fake.details, loading: fake.loading };
  },
}));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));
import MarketPlayerCard from './MarketPlayerCard';
import ExpandedPlayerModal from './ExpandedPlayerModal';

const player: MarketListingPresentation = {
  player_id: 7,
  name: 'Synthetic Player',
  img: null,
  position: 'Base',
  team_id: 1,
  team: 'Alpha',
  team_img: null,
  real_price: null,
  recent_scores: '5,X,-1,12,',
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
  price_trend: 1,
  avg_recent_points: 5,
  value_score: 31,
  total_points: 20,
  season_avg: 10,
  recommendation_score: 0,
  recommendation_label: '',
  recommendation_color: '',
  recommendation_dot: '',
  recommendation_icon: '',
};
const modal = (value: MarketListingPresentation | null = player) =>
  renderToStaticMarkup(<ExpandedPlayerModal player={value} onClose={() => {}} />);
const card = (value = player, expanded = false) =>
  renderToStaticMarkup(
    <MarketPlayerCard
      player={value}
      isExpanded={expanded}
      onToggleExpand={() => {}}
      onExpandLevel2={() => {}}
    />
  );
beforeEach(() => {
  vi.clearAllMocks();
  fake.mounted = true;
  fake.details = undefined;
  fake.loading = false;
  vi.stubGlobal('document', { body: {} });
});
afterEach(() => vi.unstubAllGlobals());

it('keeps card request timing, existing profile URL and missing-detail copy', () => {
  expect(card()).toContain('Error cargando detalles');
  expect(fake.api).toHaveBeenLastCalledWith('/api/players/7/stats', { skip: true });
  expect(card(player, true)).toContain('Compra Excelente');
  expect(fake.api).toHaveBeenLastCalledWith('/api/players/7/stats', { skip: false });
});
it.each([
  [5, 1, 'Compra Arriesgada'],
  [20, 0, 'Compra Normal'],
] as const)('retains fallback heuristic %s/%s', (value_score, price_trend, label) => {
  expect(card({ ...player, value_score, price_trend })).toContain(label);
});
it('retains supplied recommendation and loaded analysis link independently of heuristic fallback', () => {
  fake.details = { games_played: 2, total_points: 40 };
  const html = card(
    {
      ...player,
      recommendation_label: 'Owned recommendation',
      recommendation_icon: 'unknown',
      recommendation_color: 'text-emerald-400',
    },
    true
  );
  expect(html).toContain('Owned recommendation');
  expect(html).toContain('Ver Análisis Completo');
  expect(html).toContain('via-emerald-500/60');
  expect(html).toContain('Sin próximos partidos');
});
it('preserves modal mounting, skipped null-player request and empty/loading states', () => {
  fake.mounted = false;
  expect(modal()).toBe('');
  fake.mounted = true;
  expect(modal(null)).toBe('');
  expect(fake.api).toHaveBeenLastCalledWith('/api/players/undefined/stats', { skip: true });
  expect(modal()).toContain('Datos de análisis no disponibles.');
  fake.loading = true;
  expect(modal()).toContain('animate-spin');
});
it.each([
  [24, 'Titular Fijo'],
  [18, 'Titular/Sexto Hombre'],
  [12, 'Rotación'],
  [6, 'Fondo de Banquillo'],
] as const)('preserves role threshold %s', (minutes, role) => {
  fake.details = {
    recentMatches: [
      { minutes_played: minutes, fantasy_points: 12, home_id: 1, home_score: 80, away_score: 70 },
    ],
    nextMatches: [],
    advancedStats: { two_points_made: 1, two_points_attempted: 2 },
    season_avg: '12.5',
    playoff_probability: 80,
  };
  const html = modal();
  expect(html).toContain(role);
  expect(html).toContain('50%');
  expect(html).toContain('12.5');
  expect(html).toContain('href="/player/7"');
  expect(html).toContain('Mercado Libre');
  expect(fake.api).toHaveBeenLastCalledWith('/api/players/7/stats', { skip: false });
});
