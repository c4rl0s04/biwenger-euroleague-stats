import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { RoundComparisonControls } from './RoundComparisonControls';
it('retains independent metric selection and protects the only compared manager', () => {
  const html = renderToStaticMarkup(
    <RoundComparisonControls
      users={[{ id: '7', name: 'Manager', icon: null, color_index: 0 }]}
      selectedIds={['7']}
      metrics={{ actual: true, ideal: false }}
      onToggleMetric={vi.fn()}
      onToggleUser={vi.fn()}
    />
  );
  expect(html).toContain('aria-label="Métricas del historial"');
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('aria-pressed="false"');
  expect(html).toContain('Añadir usuario a comparar');
  expect(html).toContain('disabled');
  expect(html).not.toContain('Quitar Manager');
});
