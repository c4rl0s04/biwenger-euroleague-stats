import { test as base, expect } from 'playwright/test';

export { expect };
export const test = base.extend({
  page: async ({ page }, runWithPage) => {
    const errors: string[] = [];
    await page.route('**/_vercel/insights/script.js*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );
    // Keep map rendering and controls real while removing live tile/network variability.
    await page.route('https://basemaps.cartocdn.com/**/style.json', (route) =>
      route.fulfill({
        json: {
          version: 8,
          sources: {},
          layers: [
            {
              id: 'fixture-background',
              type: 'background',
              paint: { 'background-color': '#101014' },
            },
          ],
        },
      })
    );
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.pathname.startsWith('/api/') && response.status() >= 400) {
        errors.push(`${response.status()} ${url.pathname}`);
      }
    });
    await runWithPage(page);
    expect(errors, 'No browser exceptions or failed application API requests').toEqual([]);
  },
});
