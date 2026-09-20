import { test, expect } from './fixtures';

test('Compare preserves opponent selection and original screens', async ({ page }, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  await page.goto('/login?callbackUrl=%2Fcompare');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/compare$/);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  await expect(
    page.getByRole('heading', {
      name: phone ? 'Comparativa' : 'Analítica Comparativa',
      exact: true,
    })
  ).toBeVisible();
  const capture = async (name: string) => {
    if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
      return;
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  };
  if (phone) {
    const opponent = page.locator('a[href^="/compare/"]').first();
    await expect(opponent).toBeVisible();
    await capture('compare-picker');
    await opponent.click();
    await expect(page.getByText('Últimas jornadas', { exact: true })).toBeVisible();
    await capture('compare-opponent');
  } else {
    await expect(page.getByText('Cargando centro de datos avanzado...')).toHaveCount(0);
    await expect(page.getByText('Error cargando datos de comparación.')).toHaveCount(0);
    await expect(page.getByText('Estadísticas Generales', { exact: false }).first()).toBeVisible();
    await capture('compare-desktop');
    const selector = page.getByRole('button', { name: /^RIVAL:/ });
    await selector.click();
    await page.getByRole('button', { name: 'Fixture Rival', exact: true }).click();
    await expect(selector).toContainText('Fixture Rival');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
});
