import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ManagerDistributionList } from './ManagerDistributionList';

it('keeps the full-width visualization separate from the linked manager identity', () => {
  const html = renderToStaticMarkup(
    <ManagerDistributionList
      items={[{ id: 0, low: 20, high: 90 }]}
      getKey={(item) => item.id}
      getIdentity={(item) => ({ id: item.id, name: 'Range Manager' })}
      renderVisualization={(item) => (
        <button aria-label="Range detail">
          {item.low}–{item.high}
        </button>
      )}
    />
  );
  expect(html).toContain('data-stat-list="distribution"');
  expect(html).toContain('href="/user/0"');
  expect(html.indexOf('</a>')).toBeLessThan(html.indexOf('<button'));
  expect(html).toContain('20–90');
});
it('shows an explicit empty state without inventing rows', () => {
  const html = renderToStaticMarkup(
    <ManagerDistributionList
      items={[]}
      getKey={() => ''}
      getIdentity={() => ({ id: null, name: null })}
      renderVisualization={() => null}
      emptyMessage="Sin distribución"
    />
  );
  expect(html).toContain('Sin distribución');
  expect(html).not.toContain('<li');
});
