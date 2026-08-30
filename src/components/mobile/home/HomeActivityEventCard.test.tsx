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
  {
    id: 'round_highlight:4',
    type: 'round_highlight',
    occurredAt: '2026-10-17T22:00:00.000Z',
    roundId: 4,
    roundName: 'Jornada 4',
    mvps: [
      {
        id: 1,
        name: 'Mike James',
        position: 'Base',
        image: null,
        teamName: 'MON',
        points: 35,
        valuation: 30,
        role: 'titular',
        multiplier: 2,
        isCaptain: true,
      },
      {
        id: 2,
        name: 'Kendrick Nunn',
        position: 'Base',
        image: null,
        teamName: 'PAN',
        points: 35,
        valuation: 29,
        role: 'titular',
        multiplier: 1,
        isCaptain: false,
      },
    ],
    idealLineup: Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      name: index === 0 ? 'Mike James' : index === 1 ? 'Kendrick Nunn' : `Jugador ${index + 1}`,
      position: index < 3 ? 'Base' : index < 7 ? 'Alero' : 'Pivot',
      image: null,
      teamName: 'RMB',
      points: 35 - index,
      valuation: 25 - index,
      role:
        index < 5 ? ('titular' as const) : index === 5 ? ('6th_man' as const) : ('bench' as const),
      multiplier: index === 0 ? 2 : index < 5 ? 1 : index === 5 ? 0.75 : 0.5,
      isCaptain: index === 0,
    })),
    totalPoints: 245,
  },
  {
    id: 'tournament_round:9:40',
    type: 'tournament_round',
    occurredAt: '2026-05-20T21:00:00.000Z',
    tournamentId: 9,
    tournamentName: 'Copa Primavera',
    roundId: 40,
    roundName: 'Final',
    fixtures: [
      {
        id: 44,
        home: { id: '7', name: 'All Stars', icon: null, colorIndex: 2, score: 185 },
        away: { id: '3', name: 'June', icon: null, colorIndex: 4, score: 172 },
      },
      {
        id: 45,
        home: { id: '1', name: 'ask72', icon: null, colorIndex: 1, score: 164 },
        away: { id: '2', name: 'No Name Yet', icon: null, colorIndex: 5, score: 170 },
      },
    ],
    champion: { id: '7', name: 'All Stars', icon: null, colorIndex: 2 },
  },
];

describe('home activity event renderer', () => {
  it.each([
    ['transfer_day', 'Mike James'],
    ['round_completed', 'No Name Yet'],
    ['admin_bonus', 'Premio especial'],
    ['match_session', 'RMB'],
    ['prediction_round', 'Manager 7'],
    ['round_highlight', 'Kendrick Nunn'],
    ['tournament_round', 'No Name Yet'],
  ] as const)('renders the %s visual variant', (type, expectedText) => {
    const event = events.find((item) => item.type === type)!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain(expectedText);
    expect(html).toContain('<time');
  });

  it('renders every tournament fixture and the champion banner', () => {
    const event = events.find((item) => item.type === 'tournament_round')!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain('Copa Primavera');
    expect(html).toContain('Campeón');
    expect(html).toContain('All Stars');
    expect(html).toContain('185');
    expect(html).toContain('170');
    expect(html).toContain('/tournaments/9/results');
  });

  it('shows tied MVPs and the complete ideal lineup with explicit roles', () => {
    const event = events.find((item) => item.type === 'round_highlight')!;
    const html = renderToStaticMarkup(<HomeActivityEventCard event={event} />);

    expect(html).toContain('MVP compartido');
    expect(html).toContain('Equipo ideal');
    expect(html).toContain('Capitán');
    expect(html).toContain('Sexto hombre');
    expect(html).toContain('245 pts');
    expect(html).toContain('/rounds/4/stats');
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
