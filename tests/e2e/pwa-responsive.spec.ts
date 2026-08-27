import { expect, test } from 'playwright/test';
import type { Page } from 'playwright';

async function expectNoGlobalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(Math.max(dimensions.document, dimensions.body)).toBeLessThanOrEqual(
    dimensions.viewport + 1
  );
}

test('public PWA routes work without a session and do not overflow', async ({ page, request }) => {
  await page.goto('/install');
  await expect(page.getByRole('heading', { name: /BiwengerStats en tu móvil/i })).toBeVisible();
  await expectNoGlobalOverflow(page);

  await page.goto('/offline');
  await expect(page.getByRole('heading', { name: /Sin conexión/i })).toBeVisible();
  await expectNoGlobalOverflow(page);

  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBeTruthy();
  expect((await manifestResponse.json()).display).toBe('standalone');

  const workerResponse = await request.get('/sw.js');
  expect(workerResponse.ok()).toBeTruthy();
  expect(workerResponse.headers()['cache-control']).toContain('no-cache');
});

test('login remains usable with a virtual-keyboard-sized viewport', async ({ page }) => {
  await page.goto('/login?callbackUrl=%2Fdashboard');
  await expect(page.getByLabel('Manager')).toBeVisible();
  await expect(page.locator('#login-password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await expectNoGlobalOverflow(page);
});

test('authenticated mobile shell exposes bottom navigation and More sheet', async ({ page }) => {
  test.skip(
    !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
    'Set E2E_USERNAME and E2E_PASSWORD to exercise authenticated routes.'
  );

  await page.goto('/login?callbackUrl=%2Fdashboard');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const presentation = await page.locator('[data-presentation]').getAttribute('data-presentation');

  if (presentation === 'phone') {
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--app-safe-area-top', '32px');
    });

    const header = page.getByRole('banner');
    const searchButton = page.getByRole('button', { name: 'Abrir búsqueda' });
    const profileButton = page.getByRole('button', { name: 'Abrir perfil' });
    const [headerBox, searchBox, profileBox] = await Promise.all([
      header.boundingBox(),
      searchButton.boundingBox(),
      profileButton.boundingBox(),
    ]);

    expect(headerBox?.height).toBeGreaterThanOrEqual(96);
    expect(searchBox?.y).toBeGreaterThanOrEqual(32);
    expect(profileBox?.y).toBeGreaterThanOrEqual(32);

    const navigation = page.getByRole('navigation', { name: 'Navegación principal móvil' });
    await expect(navigation).toBeVisible();

    let releaseStandingsRequest = () => {};
    const standingsRequestBlocked = new Promise<void>((resolve) => {
      releaseStandingsRequest = resolve;
    });
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/standings') {
        await standingsRequestBlocked;
      }
      await route.continue();
    });

    const standingsLink = navigation.getByRole('link', { name: 'Clasificación' });
    const navigationPromise = standingsLink.click();
    await expect(standingsLink).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('status', { name: 'Cargando Clasificación' })).toBeVisible();
    releaseStandingsRequest();
    await navigationPromise;
    await expect(page).toHaveURL(/\/standings/);

    await navigation.getByRole('button', { name: 'Más' }).click();
    await expect(page.getByRole('dialog', { name: /Más secciones/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Más secciones/i })).toBeHidden();
  } else {
    await expect(
      page.getByRole('navigation', { name: 'Navegación principal móvil' })
    ).toHaveCount(0);
  }

  await expectNoGlobalOverflow(page);
});
