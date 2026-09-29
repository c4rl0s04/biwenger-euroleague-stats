import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { SeasonPredictionsScreen } from './SeasonPredictionsScreen';

vi.mock('@/components/shell/mobile/MobileHeaderActions', () => ({ default: () => null }));

it('renders both configured sections, prompts and the demo-state notice', () => {
  const html = renderToStaticMarkup(
    <SeasonPredictionsScreen seasonName="2026/27" options={{ players: [], managers: [] }} />
  );
  expect(html).toContain('Predicciones de temporada');
  expect(html.indexOf('Jugadores')).toBeLessThan(html.indexOf('Mánagers'));
  expect(html).toContain('¿Qué jugador sumará más puntos?');
  expect(html).toContain('¿Qué mánager terminará primero?');
  expect(html).toContain('Tus elecciones no se guardan');
  expect(html).toContain('Elige un jugador');
  expect(html).toContain('Elige un mánager');
});

it('renders the shared phone header with one page title and the same questions', () => {
  const html = renderToStaticMarkup(
    <SeasonPredictionsScreen seasonName="2026/27" options={{ players: [], managers: [] }} phone />
  );
  expect(html).toContain('class="mobile-native-header"');
  expect(html).toContain('id="mobile-screen-title"');
  expect(html).toContain('>Predicciones</h1>');
  expect(html).not.toContain('Predicciones de temporada</h1>');
  expect(html).toContain('¿Qué jugador sumará más puntos?');
  expect(html).toContain('¿Qué mánager terminará primero?');
});
