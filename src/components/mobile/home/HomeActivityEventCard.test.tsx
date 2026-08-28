import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { HomeActivityEvent } from '@/lib/home/contracts';
import HomeActivityEventCard from './HomeActivityEventCard';

const events: HomeActivityEvent[] = [
  {
    id: 'transfer:1',
    type: 'transfer',
    occurredAt: '2026-10-20T20:00:00.000Z',
    player: { id: 10, name: 'Mike James', position: 'Base', image: null, teamCode: 'MON' },
    seller: { id: null, name: 'Mercado' },
    buyer: { id: '7', name: 'All Stars' },
    amount: 3500000,
  },
  {
    id: 'round_completed:4',
    type: 'round_completed',
    occurredAt: '2026-10-19T20:00:00.000Z',
    roundId: 4,
    roundName: 'Jornada 4',
    totalBonus: 2100000,
    participants: [
      {
        userId: '7',
        name: 'All Stars',
        icon: null,
        colorIndex: 1,
        position: 1,
        points: 201,
        bonus: 300000,
      },
    ],
  },
  {
    id: 'admin_bonus:1',
    type: 'admin_bonus',
    occurredAt: '2026-10-18T20:00:00.000Z',
    recipient: { id: '7', name: 'All Stars', icon: null, colorIndex: 1 },
    amount: 500000,
    description: 'Premio especial',
  },
  {
    id: 'match_session:4:2026-10-17',
    type: 'match_session',
    occurredAt: '2026-10-17T20:00:00.000Z',
    roundId: 4,
    roundName: 'Jornada 4',
    sessionDate: '2026-10-17',
    matches: [
      {
        id: 20,
        home: { id: 1, name: 'Madrid', code: 'RMB', image: null, score: 90 },
        away: { id: 2, name: 'París', code: 'PAR', image: null, score: 84 },
      },
    ],
  },
];

describe('home activity event renderer', () => {
  it.each([
    ['transfer', 'Mike James'],
    ['round_completed', 'Jornada 4'],
    ['admin_bonus', 'Premio especial'],
    ['match_session', 'RMB'],
  ] as const)('renders the %s visual variant', (type, expectedText) => {
    const event = events.find((item) => item.type === type)!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain(expectedText);
    expect(html).toContain('<time');
  });
});
