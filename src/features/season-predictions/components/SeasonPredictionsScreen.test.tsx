import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { SeasonPredictionsScreen } from './SeasonPredictionsScreen';

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
