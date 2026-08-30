import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomeActivityFilterBar from './HomeActivityFilterBar';
import MobileHomeActivityProvider from './MobileHomeActivityProvider';

describe('mobile home activity filters', () => {
  it('renders the five single-select categories and exposes the active filter', () => {
    const html = renderToStaticMarkup(
      <MobileHomeActivityProvider initialFilter="transfers">
        <HomeActivityFilterBar />
      </MobileHomeActivityProvider>
    );

    for (const label of ['Todos', 'Fichajes', 'Jornadas + primas', 'Porras', 'Resultados']) {
      expect(html).toContain(label);
    }
    expect(html).not.toMatch(/>Primas</);
    expect(html).toContain('aria-label="Filtrar actividad"');
    expect(html).toMatch(/aria-pressed="true"[^>]*>[\s\S]*Fichajes/);
  });
});
