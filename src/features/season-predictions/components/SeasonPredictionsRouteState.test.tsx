import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { SeasonPredictionsRouteState } from './SeasonPredictionsRouteState';

vi.mock('@/components/shell/mobile/MobileHeaderActions', () => ({ default: () => null }));

it('provides desktop and phone headers for route loading and error states', () => {
  const html = renderToStaticMarkup(
    <SeasonPredictionsRouteState description="Cargando…">
      <span>Contenido</span>
    </SeasonPredictionsRouteState>
  );
  expect(html).toContain('data-page-canvas');
  expect(html).toContain('mobile-native-header');
  expect(html).toContain(' de temporada</h1>');
  expect(html).toContain('mobile-screen-title');
});
