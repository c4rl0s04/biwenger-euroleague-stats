import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { PREDICTION_QUESTIONS } from '../models/questions';
import type { SeasonPredictionsPageData } from '../models/submission';
import { SeasonPredictionsScreen } from './SeasonPredictionsScreen';

vi.mock('@/components/shell/mobile/MobileHeaderActions', () => ({ default: () => null }));

const data: SeasonPredictionsPageData = {
  seasonId: '2026-27',
  status: 'open',
  opensAt: '2026-10-01T00:00:00.000Z',
  locksAt: '2026-10-08T00:00:00.000Z',
  locksAtLabel: '8 de octubre de 2026, 2:00',
  serverNow: '2026-10-02T00:00:00.000Z',
  questionSetVersion: 'season-predictions-v1',
  questions: [...PREDICTION_QUESTIONS],
  options: {
    players: [{ id: 'p1', name: 'Jugador', image: null }],
    teams: [{ id: 't1', name: 'Equipo', image: null }],
    managers: [{ id: 'm1', name: 'Mánager', image: null }],
  },
  submission: null,
  league: null,
};

it('renders the 12 questions in section order and a single page-level save', () => {
  const html = renderToStaticMarkup(<SeasonPredictionsScreen seasonName="2026/27" data={data} />);
  expect(html.indexOf('Jugadores')).toBeLessThan(html.indexOf('Equipos'));
  expect(html.indexOf('Equipos')).toBeLessThan(html.indexOf('Mánagers'));
  for (const question of PREDICTION_QUESTIONS) expect(html).toContain(question.prompt);
  expect(html.match(/>Guardar predicciones<\/button>/g)).toHaveLength(1);
  expect(html).toContain('Usar este orden');
  expect(html).not.toContain('Hay cambios sin guardar');
});

it('renders the same prompts with the shared phone header', () => {
  const html = renderToStaticMarkup(
    <SeasonPredictionsScreen seasonName="2026/27" data={data} phone />
  );
  expect(html).toContain('class="mobile-native-header"');
  expect(html).toContain('id="mobile-screen-title"');
  for (const question of PREDICTION_QUESTIONS) expect(html).toContain(question.prompt);
});

it('shows progress and frozen team and manager images in ranking presentations', () => {
  const populated: SeasonPredictionsPageData = {
    ...data,
    options: {
      ...data.options,
      teams: [{ id: 't1', name: 'Equipo', image: '/team-logo.png' }],
      managers: [{ id: 'm1', name: 'Mánager', image: '/manager-avatar.png' }],
    },
    submission: {
      answers: {
        'team-ranking': { kind: 'ranking', ids: ['t1'] },
        'manager-ranking': { kind: 'ranking', ids: ['m1'] },
      },
      revision: 1,
      updatedAt: '2026-10-02T00:00:00.000Z',
    },
  };
  const desktop = renderToStaticMarkup(
    <SeasonPredictionsScreen seasonName="2026/27" data={populated} />
  );
  const phone = renderToStaticMarkup(
    <SeasonPredictionsScreen seasonName="2026/27" data={populated} phone />
  );
  expect(desktop).toContain('Pregunta');
  expect(desktop).toContain('Pendiente');
  expect(desktop).toContain('src="/team-logo.png"');
  expect(phone).toContain('src="/team-logo.png"');
  expect(desktop).toContain('src="/manager-avatar.png"');
  expect(phone).toContain('src="/manager-avatar.png"');
});

it('hides candidate cards and league answers before the window opens', () => {
  const html = renderToStaticMarkup(
    <SeasonPredictionsScreen
      seasonName="2026/27"
      data={{ ...data, status: 'not-open', options: { players: [], teams: [], managers: [] } }}
    />
  );
  expect(html).toContain('todavía no están abiertas');
  expect(html).not.toContain(PREDICTION_QUESTIONS[0].prompt);
  expect(html).not.toContain('Predicciones de la liga');
});
