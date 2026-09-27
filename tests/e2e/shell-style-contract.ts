import type { Page } from 'playwright';
import { expect } from './fixtures';

/** Exercise computed CSS, so invalid token syntax cannot pass as inert class strings. */
export async function expectShellPalette(page: Page) {
  // The phone root owns its gradient; desktop uses the inner ambient canvas.
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  const canvas = page.locator(phone ? '[data-presentation]' : '[data-presentation] > div');
  if (phone) await expect(canvas).toHaveCSS('background-image', /radial-gradient\(/);
  const expected = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'hsl(var(--surface-app))';
    probe.style.color = 'hsl(var(--content-primary))';
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = { background: style.backgroundColor, content: style.color };
    probe.remove();
    return result;
  });
  await expect(canvas).toHaveCSS('background-color', expected.background);
  await expect(canvas).toHaveCSS('color', expected.content);
  await expect(page.locator('.navigation-progress-bar')).toHaveCSS(
    'background-image',
    /linear-gradient\(/
  );
}
