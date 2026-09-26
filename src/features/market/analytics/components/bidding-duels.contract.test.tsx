import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
const fake = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('@/lib/hooks/useApiData', () => ({ useApiData: fake.api }));
vi.mock('@/components/ui/card-variants/ElegantCard', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/PlayerImage', () => ({ default: () => null }));
import BiddingDuelDetailsCard from './cards/BiddingDuelDetailsCard';
import BiddingDuelsMatrixCard from './cards/BiddingDuelsMatrixCard';

const user = { id: 7, name: 'Synthetic Alpha', icon: null, color_index: 0 };
const opponent = { id: 8, name: 'Synthetic Beta', icon: null, color_index: 1 };
const record = { wins: 2, losses: 1, duels: 3, total_margin: 300, avg_margin: 100 };
const selection = { user, opponent, record };
const data = {
  users: [opponent, user],
  matrix: { 7: { 8: record } },
  hottestRivalry: null,
  biggestDominance: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  fake.api.mockReturnValue({ data: [], loading: false, error: null });
});

it('renders nothing and skips the detail request without a selection', () => {
  expect(
    renderToStaticMarkup(<BiddingDuelDetailsCard selectedDuel={null} onClear={() => {}} />)
  ).toBe('');
  const [endpoint, options] = fake.api.mock.calls[0];
  expect(endpoint()).toBeNull();
  expect(options).toEqual({ dependencies: [undefined, undefined], skip: true, cacheKey: null });
});

it.each([false, true])(
  'preserves directional URLs with a symmetric browser cache key (reverse=%s)',
  (reverse) => {
    const selectedDuel = reverse ? { user: opponent, opponent: user, record } : selection;
    renderToStaticMarkup(<BiddingDuelDetailsCard selectedDuel={selectedDuel} onClear={() => {}} />);
    const [endpoint, options] = fake.api.mock.calls[0];
    expect(endpoint()).toBe(
      `/api/market/duels/details?userId=${selectedDuel.user.id}&opponentId=${selectedDuel.opponent.id}`
    );
    expect(options).toEqual({
      dependencies: [selectedDuel.user.id, selectedDuel.opponent.id],
      skip: false,
      cacheKey: 'market-duel-7-8',
    });
  }
);

it.each([
  [{ data: [], loading: true, error: null }, 'animate-pulse'],
  [{ data: [], loading: false, error: 'synthetic' }, 'No se pudo cargar el detalle del duelo.'],
  [{ data: [], loading: false, error: null }, 'No hay subastas registradas para este cruce.'],
])('preserves loading/error/empty output', (state, expected) => {
  fake.api.mockReturnValue(state);
  expect(
    renderToStaticMarkup(<BiddingDuelDetailsCard selectedDuel={selection} onClear={() => {}} />)
  ).toContain(expected);
});

it('preserves detail ordering, existing plural player URL, missing date and amounts', () => {
  fake.api.mockReturnValue({
    loading: false,
    error: null,
    data: [
      {
        transfer_id: 1,
        transfer_date: null,
        player_id: 9,
        player_name: 'Synthetic Guard',
        player_img: null,
        winner_id: 7,
        winner_name: user.name,
        winner_icon: null,
        winner_color_index: 0,
        runner_id: 8,
        runner_name: opponent.name,
        runner_icon: null,
        runner_color_index: 1,
        winning_bid: 1000,
        second_bid: 900,
        margin: 100,
      },
    ],
  });
  const html = renderToStaticMarkup(
    <BiddingDuelDetailsCard selectedDuel={selection} onClear={() => {}} />
  );
  expect(html).toContain('href="/players/9"');
  expect(html).toContain('Fecha no disponible');
  expect(html).toContain('Synthetic Guard');
  expect(html).toContain('Cerrar detalle');
  expect(html).toContain('2 victorias');
});

it('preserves selectable matrix labels, selected state and original array order', () => {
  const html = renderToStaticMarkup(
    <BiddingDuelsMatrixCard data={data} selectedDuel={selection} onSelectDuel={() => {}} />
  );
  expect(html).toContain(
    'aria-label="Synthetic Alpha contra Synthetic Beta, 2 victorias, 1 derrotas y 3 duelos"'
  );
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('tabindex="0"');
  expect(data.users[0]).toBe(opponent);
});

it('does not silently change the existing null-name sorting failure', () => {
  expect(() =>
    renderToStaticMarkup(
      <BiddingDuelsMatrixCard data={{ ...data, users: [user, { ...opponent, name: null }] }} />
    )
  ).toThrow(TypeError);
  expect(renderToStaticMarkup(<BiddingDuelsMatrixCard data={{ ...data, users: [] }} />)).toBe('');
});
