import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AppBackground } from './AppBackground';

it('leaves the existing phone shell background visible', () => {
  expect(
    renderToStaticMarkup(
      <AppBackground presentationMode="phone">
        <p>Content</p>
      </AppBackground>
    )
  ).toBe('<p>Content</p>');
});

it('retains semantic ambient backgrounds for desktop', () => {
  const html = renderToStaticMarkup(
    <AppBackground>
      <p>Content</p>
    </AppBackground>
  );
  expect(html).toContain('--surface-app');
  expect(html).toContain('--effect-shell-ambient-primary');
  expect(html).toContain('<p>Content</p>');
});
