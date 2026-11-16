import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Popover } from './Popover';
it('connects a named trigger to a native disclosure with its full detail content', () => {
  const html = renderToStaticMarkup(
    <Popover label="Jornada 6: eficiencia" trigger="95%">
      <p>Real: 95 · Ideal: 100</p>
    </Popover>
  );
  expect(html).toContain('popover="auto"');
  const id = html.match(/popovertarget="([^"]+)"/i)?.[1];
  expect(id).toBeTruthy();
  expect(html).toContain(`id="${id}"`);
  expect(html).toContain('aria-label="Jornada 6: eficiencia"');
  expect(html).toContain('Real: 95 · Ideal: 100');
});
