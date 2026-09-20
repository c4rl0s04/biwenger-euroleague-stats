import { test, expect } from './fixtures';

test('Schedule preserves original read screens and map navigation', async ({ page }, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  await page.route('**/api/users/lineup', () => {
    throw new Error('Schedule read verification must never submit a lineup');
  });
  await page.goto('/login?callbackUrl=%2Fschedule');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  await expect(
    page.getByRole('heading', { name: phone ? 'Horario' : 'Horario Jugadores', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Auto-Alinear', exact: true })).toBeVisible();
  await expect(page.locator('a[href="/player/99101"]').first()).toBeVisible();
  const capture = async (name: string) => {
    if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
      return;
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: phone,
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  };
  await capture('schedule-overview');
  if (phone) {
    const mapLink = page.locator('a.mobile-section-link[href="/schedule/map"]');
    await expect(mapLink).toBeVisible();
    await mapLink.click();
    await expect(page).toHaveURL(/\/schedule\/map$/);
    await expect(
      page.getByRole('heading', { name: 'Mapa de partidos', exact: true })
    ).toBeVisible();
    await capture('schedule-map');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
});
