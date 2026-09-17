import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CurrentMarketListing } from '../models/market-catalogue';
import type { RecentTransfer } from '../models/market-activity-extra';
import type { MobileMarketOverview } from '../models/market-screen';
vi.mock('@/components/mobile/MobileHeaderActions', () => ({ default: () => null }));
import MobileMarketScreen from './MobileMarketScreen';

const listing = (id: number): CurrentMarketListing => ({
  player_id: id,
  name: `Synthetic player ${id}`,
  img: null,
  position: null,
  team_id: null,
  team: null,
  team_img: null,
  real_price: null,
  recent_scores: null,
  min_points: null,
  max_points: null,
  games_played: null,
  seller_id: null,
  seller_name: null,
  seller_icon: null,
  seller_color: null,
  next_opponent_id: null,
  next_opponent_name: null,
  next_opponent_img: null,
  next_match_date: null,
  player_team: null,
  price: 1500000,
  price_trend: 0,
  avg_recent_points: 0,
  value_score: 0,
  total_points: 0,
  season_avg: 12.5,
  recommendation_score: 0,
  recommendation_label: '',
  recommendation_color: '',
  recommendation_dot: '',
  recommendation_icon: '',
});
const transfer = (id: number): RecentTransfer => ({
  id,
  season_id: 'synthetic',
  timestamp: null,
  fecha: null,
  player_id: id,
  precio: null,
  vendedor: null,
  comprador: null,
  player_name: null,
  position: null,
  vendedor_id: null,
  vendedor_color_index: null,
  comprador_id: null,
  comprador_color_index: null,
});
const model = (): MobileMarketOverview => ({
  listings: [],
  recentTransfers: [],
  kpis: {
    total_transfers: 0,
    avg_value: 0,
    min_value: 0,
    max_value: 0,
    active_buyers: 0,
    active_sellers: 0,
  },
});

it('preserves the four analysis URLs and zero-data presentation', () => {
  const html = renderToStaticMarkup(<MobileMarketScreen {...model()} />);
  for (const section of ['transfers', 'investments', 'bids', 'trends']) {
    expect(html).toContain(`href="/market/${section}"`);
  }
  for (const text of [
    'Mercado',
    'Disponibles',
    'Operaciones',
    'Precio medio',
    'Compradores',
    'Actividad reciente',
  ]) {
    expect(html).toContain(text);
  }
});

it('preserves listing order, twelve-row limit, links and Spanish/null formatting', () => {
  const value = model();
  value.listings = Array.from({ length: 13 }, (_, index) => listing(index + 1));
  const html = renderToStaticMarkup(<MobileMarketScreen {...value} />);
  expect(html).toContain('href="/player/1"');
  expect(html).toContain('href="/player/12"');
  expect(html).not.toContain('href="/player/13"');
  expect(html.indexOf('Synthetic player 1')).toBeLessThan(html.indexOf('Synthetic player 12'));
  expect(html).toContain('Sin equipo · 12,5 pts');
  expect(html).toContain('1,5');
  expect(html).toContain('mobile-position-chip">—');
});

it('preserves four recent rows and fallback names/prices from the real service contract', () => {
  const value = model();
  value.recentTransfers = Array.from({ length: 5 }, (_, index) => transfer(index + 1));
  const html = renderToStaticMarkup(<MobileMarketScreen {...value} />);
  expect(html.match(/Movimiento/g)).toHaveLength(4);
  expect(html.match(/Mercado → Mercado/g)).toHaveLength(4);
  expect(html).toContain('0€');
});
