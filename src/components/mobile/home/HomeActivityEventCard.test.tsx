import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { HomeActivityEvent } from '@/lib/home/contracts';
import HomeActivityEventCard from './HomeActivityEventCard';

const events: HomeActivityEvent[] = [
  {
    id: 'transfer_day:2026-10-20',
    type: 'transfer_day',
    occurredAt: '2026-10-20T20:00:00.000Z',
    date: '2026-10-20',
    transfers: [
      {
        id: 'transfer:1',
        occurredAt: '2026-10-20T20:00:00.000Z',
        player: {
          id: 10,
          name: 'Mike James',
          position: 'Base',
          image: null,
          teamCode: 'MON',
        },
        seller: {
          id: null,
          name: 'Mercado',
          icon: null,
          colorIndex: 0,
          isMarket: true,
        },
        buyer: {
          id: '7',
          name: 'All Stars',
          icon: null,
          colorIndex: 2,
          isMarket: false,
        },
        amount: 3500000,
        marketValue: 3000000,
        marketValueAt: '2026-10-20',
      },
    ],
  },
  {
    id: 'round_completed:4',
    type: 'round_completed',
    occurredAt: '2026-10-19T20:00:00.000Z',
    roundId: 4,
    roundName: 'Jornada 4',
    totalBonus: 2100000,
    participants: Array.from({ length: 7 }, (_, index) => ({
      userId: '7',
      name: index === 6 ? 'No Name Yet' : `Manager ${index + 1}`,
      icon: null,
      colorIndex: 1,
      position: index + 1,
      points: 201 - index * 10,
      bonus: index === 6 ? 0 : 300000,
    })),
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
  {
    id: 'prediction_round:4',
    type: 'prediction_round',
    occurredAt: '2026-10-17T22:00:00.000Z',
    roundId: 4,
    roundName: 'Jornada 4',
    totalMatches: 3,
    actualResults: ['1', 'X', '2'],
    participants: Array.from({ length: 7 }, (_, index) => ({
      userId: String(index + 1),
      name: `Manager ${index + 1}`,
      icon: null,
      colorIndex: index,
      participation:
        index < 5
          ? ('complete' as const)
          : index === 5
            ? ('partial' as const)
            : ('absent' as const),
      hits: index < 5 ? 3 - (index % 3) : index === 5 ? 1 : 0,
      position: index < 5 ? index + 1 : null,
      userMatches: index < 5 ? 3 : index === 5 ? 2 : 0,
      predictions: index === 6 ? [] : ['1', index === 0 ? 'X' : '2', index < 5 ? '2' : null],
    })),
  },
];

describe('home activity event renderer', () => {
  it.each([
    ['transfer_day', 'Mike James'],
    ['round_completed', 'No Name Yet'],
    ['admin_bonus', 'Premio especial'],
    ['match_session', 'RMB'],
    ['prediction_round', 'Manager 7'],
  ] as const)('renders the %s visual variant', (type, expectedText) => {
    const event = events.find((item) => item.type === type)!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain(expectedText);
    expect(html).toContain('<time');
  });

  it('describes partial and absent predictions and exposes exact picks without relying on color', () => {
    const event = events.find((item) => item.type === 'prediction_round')!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain('Parcial 2/3');
    expect(html).toContain('No participó');
    expect(html).toContain('Ver pronósticos');
    expect(html).toContain('Acierto');
    expect(html).toContain('Fallo');
    expect(html).toContain('/predictions/history');
  });

  it('labels a zero round payment without an ambiguous +0 amount', () => {
    const event = events.find((item) => item.type === 'round_completed')!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain('Sin prima');
  });
});
