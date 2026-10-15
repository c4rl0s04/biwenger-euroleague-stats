import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileScheduleScreen from './MobileScheduleScreen';
import type { ScheduleMatch, ScheduleMatchPlayer } from '../models/schedule';

vi.mock('./ScheduleLineupAction', () => ({ default: () => <button>Auto-Alinear</button> }));
vi.mock('@/components/shell/mobile/MobileHeaderActions', () => ({ default: () => null }));

const player = {
  id: 1,
  name: null,
  position: 'Base',
  team_code: 'MAD',
  puntos: 0,
  img: null,
} as ScheduleMatchPlayer;
const match = {
  match_id: 1,
  date: '2026-10-15T22:30:00Z',
  home_id: 2,
  away_id: 3,
  home_team: 'Madrid',
  away_team: 'Athens',
  user_players: [player],
} as ScheduleMatch;

it('groups by Madrid day, preserves links, zero points and missing identity', () => {
  const html = renderToStaticMarkup(
    <MobileScheduleScreen
      rounds={[]}
      schedule={{
        found: true,
        round: { round_id: 1, round_name: 'J1' },
        matches: [match, { ...match, match_id: 2, user_players: [] }],
      }}
    />
  );
  expect(html.match(/schedule-mobile-day/g)).toHaveLength(1);
  expect(html).toContain('viernes, 16 de octubre');
  expect(html).toContain('00:30');
  expect(html).toContain('href="/team/2"');
  expect(html).toContain('href="/player/1"');
  expect(html).toContain('href="/schedule/map"');
  expect(html).toContain('0 pts');
  expect(html).toContain('Jugador');
  expect(html).toContain('Sin jugadores');
  expect(html).toContain('schedule-mobile-match-active');
});

it('shows unavailable and empty states without an alignment action', () => {
  for (const schedule of [
    { found: false as const, message: 'No user selected' },
    { found: true as const, round: { round_id: 1, round_name: 'J1' }, matches: [] },
  ]) {
    const html = renderToStaticMarkup(<MobileScheduleScreen rounds={[]} schedule={schedule} />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain('Auto-Alinear');
    expect(html).toContain(schedule.found ? 'No hay partidos programados' : 'No user selected');
  }
});

it('keeps separate days, undated matches and the desktop squad summary source', () => {
  const html = renderToStaticMarkup(
    <MobileScheduleScreen
      rounds={[{ round_id: 1, round_name: 'Jornada 1' }]}
      schedule={{
        found: true,
        round: { round_id: 1, round_name: 'Jornada 1' },
        userPlayers: [
          { ...player, puntos: -2 },
          { ...player, id: 2, puntos: null },
        ],
        matches: [
          match,
          { ...match, match_id: 2, date: '2026-10-17T18:00:00Z' },
          { ...match, match_id: 3, date: null },
        ],
      }}
    />
  );
  expect(html.match(/schedule-mobile-day/g)).toHaveLength(3);
  expect(html).toContain('sábado, 17 de octubre');
  expect(html).toContain('Fecha por confirmar');
  expect(html).toContain('<dd>2</dd>');
  expect(html).toContain('<dd>-2</dd>');
  expect(html).toContain('aria-current="page"');
});
