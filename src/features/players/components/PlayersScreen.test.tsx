import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui', () => ({ PageHeader: 'page-header' }));
vi.mock('./desktop/catalogue/PlayersDiscovery', () => ({ default: 'players-discovery' }));
vi.mock('./mobile/MobilePlayersScreen', () => ({ default: 'mobile-players-screen' }));

import type { PlayerCatalogueItemViewModel } from '../models/player-catalogue';
import { PlayersScreen } from './PlayersScreen';

const players = [
  {
    id: 7,
    name: 'Sergio Base',
    team_name: 'Madrid',
    position: 'Base',
  },
  {
    id: 8,
    name: 'Alero Rival',
    team_name: 'Valencia',
    position: 'Alero',
  },
] as PlayerCatalogueItemViewModel[];

describe('PlayersScreen', () => {
  it('keeps the existing desktop catalogue composition', () => {
    const screen = PlayersScreen({ players, phone: false, query: '', position: '' });
    const main = screen.props.children[1];

    expect(screen.props.children[0].type).toBe('page-header');
    expect(main.props.children.type).toBe('players-discovery');
    expect(main.props.children.props.initialPlayers).toBe(players);
  });

  it('passes the same model through the existing phone filters', () => {
    const screen = PlayersScreen({ players, phone: true, query: 'madrid', position: 'base' });

    expect(screen.type).toBe('mobile-players-screen');
    expect(screen.props.players).toEqual([players[0]]);
    expect(screen.props.query).toBe('madrid');
    expect(screen.props.position).toBe('base');
  });
});
