import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { RoundPageSection } from './RoundPageSection';

it('retains the legacy section anchor and connects the foundation heading', () => {
  const html = renderToStaticMarkup(
    <RoundPageSection title="Estadísticas de la Ronda">
      <p>Content</p>
    </RoundPageSection>
  );
  expect(html).toContain('id="estadisticas-de-la-ronda"');
  expect(html).toContain('aria-labelledby="estadisticas-de-la-ronda-heading"');
  expect(html).toContain('<h2');
  expect(html).toContain('Content');
});
it('honors explicit anchors and alternate section surfaces', () => {
  const html = renderToStaticMarkup(
    <RoundPageSection title="Historial" id="history" background="section-raised">
      Content
    </RoundPageSection>
  );
  expect(html).toContain('id="history"');
  expect(html).toContain('surface-section-alternate');
});
