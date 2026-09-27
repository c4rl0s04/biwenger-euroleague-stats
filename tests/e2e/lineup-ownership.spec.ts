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
