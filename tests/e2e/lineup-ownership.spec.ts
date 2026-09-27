import { test, expect } from './fixtures';

test('Lineup analysis renders the same squad as the Managers HTTP contract', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  test.skip(
    !info.project.name.startsWith('iphone') &&
      !info.project.name.startsWith('android') &&
      info.project.name !== 'pixel-7',
    'Mobile-only section.'
  );
  await page.route('**/api/users/lineup', () => {
    throw new Error('Squad read verification must never submit a provider lineup.');
  });
  await page.goto('/login?callbackUrl=%2Flineup%2Fanalysis');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/lineup\/analysis$/);
  await expect(page.getByRole('heading', { name: 'Análisis', exact: true })).toBeVisible();
  const response = await page.request.get('/api/player/squad');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  const { success, data } = await response.json();
  expect(success).toBe(true);
  expect(data.players.length).toBeGreaterThan(0);
  for (const player of data.players.slice(0, 20)) {
    await expect(
      page.locator(`a[href="/player/${player.id}"]`).filter({ hasText: player.name }).first()
    ).toBeVisible();
  }
  await expect(
    page.getByText(`${Number(data.total_value).toLocaleString('es-ES')}€`, { exact: true })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
});

test('Desktop Lineup offer table and confirmation preserve financial projections', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  test.skip(info.project.name !== 'desktop-1440', 'Desktop offers composition.');
  const player = {
    id: 99101,
    name: 'Offer Fixture',
    position: 'Base',
    price: 90,
    price_increment: 0,
    average: 10,
    points: 100,
    recent_scores: '10,10',
    img: '/icons/icon-192.png',
  };
  await page.route('**/api/player/squad?*', (route) =>
    route.fulfill({ json: { success: true, data: { players: [player] } } })
  );
  await page.route('**/api/users/lineup', (route) => {
    expect(route.request().method()).toBe('GET');
    return route.fulfill({
      json: {
        success: true,
        data: {
          lineup: { type: '2-2-1', playersID: [], reservesID: [], captain: null },
          players: [{ id: 99101, owner: { price: 80 } }],
          market: [],
          offers: [
            {
              id: 99199,
              amount: 100,
              requestedPlayers: [99101],
              until: Math.floor(Date.now() / 1000) + 86400,
            },
          ],
        },
      },
    });
  });
  await page.route('**/api/market/**', (route) => {
    if (route.request().method() !== 'GET')
      throw new Error('Financial projection verification must never submit a market command.');
    return route.fallback();
  });
  await page.goto('/login?callbackUrl=%2Flineup');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/lineup$/);
  await page.getByTitle('Vista de Tabla').click();
  const row = page.getByRole('row').filter({ has: page.getByTitle('Aceptar Oferta') });
  await expect(row).toContainText('Offer Fixture');
  await expect(row).toContainText('+10 €');
  await expect(row).toContainText('+20 €');
  await row.getByTitle('Aceptar Oferta').click();
  await expect(page.getByRole('heading', { name: 'Aceptar Oferta', exact: true })).toBeVisible();
  await expect(page.getByText('Beneficio Real', { exact: true }).locator('..')).toContainText(
    '20 €'
  );
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Aceptar Oferta', exact: true })).toHaveCount(0);
});
