import { readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { test, expect } from 'playwright/test';

// Runs the installed distribution in a real browser without a database, app
// credentials, live tiles, or an attacker-controlled remote origin.
test('MapLibre attribution removes adjacent dangerous attributes', async ({ page, context }) => {
  const dist = resolve('node_modules/maplibre-gl/dist');
  const manifest = JSON.parse(await readFile(resolve(dist, '../package.json'), 'utf8'));
  const esm = Number(manifest.version.split('.')[0]) >= 6;
  await context.route('http://maplibre.test/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/') {
      await route.fulfill({
        contentType: 'text/html',
        body: '<div id="map" style="height:400px;width:400px"></div>',
      });
      return;
    }
    const file = basename(path);
    if (!/^maplibre-gl[\w.-]*\.(?:m?js|css)$/.test(file)) {
      await route.abort();
      return;
    }
    await route.fulfill({
      contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript',
      body: await readFile(resolve(dist, file)),
    });
  });
  await page.goto('http://maplibre.test/');
  await page.addStyleTag({ url: 'http://maplibre.test/maplibre-gl.css' });
  await page.addScriptTag({
    type: esm ? 'module' : undefined,
    ...(esm
      ? { content: "import * as lib from '/maplibre-gl.mjs'; window.maplibreTest = lib;" }
      : { url: 'http://maplibre.test/maplibre-gl.js' }),
  });
  await page.waitForFunction(() => 'maplibreTest' in window || 'maplibregl' in window);
  await page.evaluate(() => {
    const win = window as unknown as {
      maplibreTest?: { Map: new (options: unknown) => unknown };
      maplibregl?: { Map: new (options: unknown) => unknown };
    };
    const lib = win.maplibreTest ?? win.maplibregl!;
    new lib.Map({
      container: 'map',
      style: { version: 8, sources: {}, layers: [] },
      attributionControl: {
        compact: false,
        customAttribution:
          '<a href="https://example.com" onclick="void 0" onmouseover="void 0">Safe credit</a>',
      },
    });
  });
  const credit = page.locator('.maplibregl-ctrl-attrib-inner a');
  await expect(credit).toHaveText('Safe credit');
  await expect(credit).toHaveAttribute('href', 'https://example.com');
  expect(await credit.getAttribute('onclick')).toBeNull();
  expect(await credit.getAttribute('onmouseover')).toBeNull();
});
