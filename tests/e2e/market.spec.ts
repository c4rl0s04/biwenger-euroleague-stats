import { test, expect } from './fixtures';

test('Market original overview and working phone sections preserve empty-fixture layout', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  await page.goto('/login?callbackUrl=%2Fmarket');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/market$/);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  await expect(page.getByRole('heading', { name: 'Mercado', exact: true }).first()).toBeVisible();
  if (!phone)
    await expect(
      page.getByRole('heading', { name: 'Resumen de Mercado', exact: true })
    ).toBeVisible();

  const capture = async (name: string) => {
    // Screen source is unchanged at 91a3ea7f. These are pre-screen-migration references,
    // not complete Market acceptance: populated data, drawers and bids remain outstanding.
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
  await capture('market-empty-overview');
  if (phone) {
    // /market/bids has a confirmed pre-existing object-spread crash. Its correction needs
    // explicit approval; keep that missing acceptance visible rather than suppressing errors.
    for (const [section, title] of [
      ['transfers', 'Fichajes'],
      ['trends', 'Tendencias'],
      ['investments', 'Inversiones'],
    ]) {
      // Exercise the actual app navigation without replacing a document with active prefetches.
      await page.locator(`a.mobile-section-link[href="/market/${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/market/${section}$`));
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByText('No hay datos disponibles para esta vista.')).toBeVisible();
      await capture(`market-empty-${section}`);
      await page.getByRole('link', { name: 'Volver a Mercado', exact: true }).click();
      await expect(page).toHaveURL(/\/market$/);
      await expect(page.getByRole('heading', { name: 'Mercado', exact: true })).toBeVisible();
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
});
