import { test, expect } from './fixtures';

test('production map loads its worker and keeps markers and zoom controls', async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  await page.addInitScript(() => {
    const state = { messages: 0, errors: [] as string[] };
    Object.assign(window, { mapWorkerTest: state });
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', () => {
          state.messages += 1;
        });
        this.addEventListener('error', (event) => {
          state.errors.push(event.message);
        });
      }
    };
  });
  // A real GeoJSON source forces work through the installed worker, unlike an
  // empty background-only screenshot style. No remote tiles are downloaded.
  await page.route('https://basemaps.cartocdn.com/**/style.json', (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {
          fixture: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'Point', coordinates: [-3.7, 40.4] },
                },
              ],
            },
            attribution: 'Fixture attribution',
          },
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#101014' } },
          { id: 'fixture', type: 'circle', source: 'fixture', paint: { 'circle-radius': 8 } },
        ],
      },
    })
  );
  const phone = /^(iphone|pixel|android)/.test(testInfo.project.name);
  const destination = phone ? '/schedule/map' : '/matches';
  await page.goto(`/login?callbackUrl=${encodeURIComponent(destination)}`);
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  const canvas = page.locator('.maplibregl-canvas');
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  await expect(page.locator('.maplibregl-marker').first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { mapWorkerTest: { messages: number } }).mapWorkerTest.messages
      )
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { mapWorkerTest: { errors: string[] } }).mapWorkerTest.errors
    )
  ).toEqual([]);
  await page.locator('button:has(svg.lucide-plus)').click();
  await page.locator('button:has(svg.lucide-minus)').click();
  await expect(canvas).toBeVisible();
});
