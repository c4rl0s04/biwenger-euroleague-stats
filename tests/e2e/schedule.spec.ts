import { waitForScreenshotPaint } from './screenshot-ready';
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
    await waitForScreenshotPaint(page);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: phone,
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  };
  if (!phone) await capture('schedule-overview');
  if (phone) {
    await expect(page.locator('.schedule-mobile-day')).toHaveCount(1);
    await expect(page.locator('.schedule-mobile-summary')).toContainText('24');
    await expect(page.locator('.schedule-mobile-chip').first()).toContainText('Fixture Guard');
    await expect(page.locator('.schedule-mobile-teams a').first()).toHaveAttribute(
      'href',
      /\/team\/\d+/
    );
    const roundLink = page
      .getByRole('navigation', { name: 'Seleccionar jornada' })
      .getByRole('link')
      .first();
    await expect(roundLink).toHaveAttribute('aria-current', 'page');
    await roundLink.click();
    await expect(page).toHaveURL(/roundId=/);
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['dark', 'light']) {
        await page.evaluate(
          (value) => document.documentElement.setAttribute('data-theme', value),
          theme
        );
        await waitForScreenshotPaint(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true);
        await expect(page.locator('.schedule-mobile-chip').first()).toBeVisible();
        expect(
          await page
            .locator('.schedule-mobile-player-copy strong')
            .first()
            .evaluate((element) => getComputedStyle(element).color)
        ).toBe(
          await page
            .locator('.schedule-mobile-match time')
            .first()
            .evaluate((element) => getComputedStyle(element).color)
        );
        await page.screenshot({
          path: info.outputPath(`schedule-${width}-${theme}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.setViewportSize(info.project.use.viewport!);
    await capture('schedule-overview');
    await page.locator('.schedule-mobile-teams a').first().click();
    await expect(page).toHaveURL(/\/team\/\d+$/);
    await page.goBack();
    await page.locator('.schedule-mobile-chip').first().click();
    await expect(page).toHaveURL(/\/player\/99101$/);
    await page.goBack();
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
