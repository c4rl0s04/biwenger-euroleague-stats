import { describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';
vi.mock('@/components/mobile/MobileScreen', () => ({
  MobileBackHeader: 'mobile-back-header',
  MobileMetric: 'mobile-metric',
  MobileMetricGrid: 'mobile-metric-grid',
  MobileScreen: 'mobile-screen',
  MobileSectionHeading: 'mobile-section-heading',
  MobileSectionLink: 'mobile-section-link',
}));
import MobileManagerProfileScreen from './MobileManagerProfileScreen';
import type { ManagerSeasonStatsViewModel, ManagerSquadViewModel } from '../models/manager-reads';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}

const stats: ManagerSeasonStatsViewModel = {
  id: '07abc',
  name: 'Manager Seven',
  icon: '',
  color_index: 2,
  total_points: 1234,
  best_round: 130,
  worst_round: 20,
  average_points: 67,
  rounds_played: 18,
  best_position: 1,
  worst_position: 5,
  average_position: 3,
  victories: 2,
  podiums: 5,
  purchases: 8,
  sales: 3,
  total_spent: 100,
  total_received: 60,
  last_transfers: [],
  position: 2,
  team_value: 1000,
  price_trend: 10,
};
const squad: ManagerSquadViewModel = {
  total_value: 1000,
  price_trend: 10,
  total_points: 1234,
  player_count: 12,
  position: 2,
  top_rising: [],
  top_falling: [],
  players: [],
};

describe('Mobile Manager Profile ownership', () => {
  it('retains all five existing section links and the original identity string', () => {
    const nodes = elements(MobileManagerProfileScreen({ stats, squad }));
    expect(nodes.filter((node) => node.props.href).map((node) => node.props.href)).toEqual([
      '/user/07abc/season',
      '/user/07abc/squad',
      '/user/07abc/evolution',
      '/user/07abc/contributors',
      '/user/07abc/competitions',
    ]);
    expect(nodes.find((node) => node.props.backHref)?.props).toMatchObject({
      title: 'Manager Seven',
      context: 'Perfil de mánager',
      backHref: '/standings',
    });
  });

  it('retains the overview metrics and Spanish number formatting', () => {
    const nodes = elements(MobileManagerProfileScreen({ stats, squad }));
    expect(
      nodes.filter((node) => node.props.label).map((node) => [node.props.label, node.props.value])
    ).toEqual([
      ['Posición', '#2'],
      ['Puntos', Number(1234).toLocaleString('es-ES')],
      ['Media', Number(67).toLocaleString('es-ES')],
      ['Plantilla', 12],
    ]);
  });

  it('preserves zero-position and empty-squad output', () => {
    const nodes = elements(
      MobileManagerProfileScreen({
        stats: { ...stats, position: 0 },
        squad: { ...squad, player_count: 0 },
      })
    );
    expect(nodes.find((node) => node.props.label === 'Posición')?.props.value).toBe('—');
    expect(nodes.find((node) => node.props.label === 'Plantilla')?.props.value).toBe(0);
  });
});
