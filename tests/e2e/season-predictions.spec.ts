import { expect, test } from './fixtures';

test('season predictions demo supports player and manager choices', async ({ page }, testInfo) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires disposable season data.');
  await page.goto('/login?callbackUrl=%2Fseason-predictions');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/season-predictions$/);

  await expect(page.getByRole('heading', { name: 'Predicciones de temporada' })).toBeVisible();
  await expect(page.getByText('Tus elecciones no se guardan')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('season-predictions-dark.png'),
    fullPage: true,
  });
  const mobileMore = page.getByRole('button', { name: 'Más', exact: true });
  if (await mobileMore.isVisible()) {
    await mobileMore.click();
    await expect(page.getByRole('link', { name: 'Predicciones de temporada' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar menú Más' }).click();
  } else {
    await expect(page.locator('a[href="/season-predictions"]:visible').first()).toBeVisible();
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);

  await page.getByRole('button', { name: /Seleccionar jugador: Elige un jugador/ }).click();
  await expect(page.getByRole('dialog', { name: 'Seleccionar jugador' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('season-predictions-picker.png') });
  const playerSearch = page.getByRole('combobox', { name: 'Buscar seleccionar jugador' });
  await expect(playerSearch).toBeFocused();
  await expect(page.getByRole('option').first()).toContainText('Base');
  await playerSearch.fill('Fixture');
  await expect(page.getByRole('option').first()).toBeVisible();
  await playerSearch.press('ArrowDown');
  await playerSearch.press('Enter');
  await expect(page.getByText('Tu elección:').first()).toBeVisible();
  await page.getByRole('button', { name: /Borrar elección:/ }).click();
  await expect(
    page.getByRole('button', { name: /Seleccionar jugador: Elige un jugador/ })
  ).toBeVisible();

  await page.getByRole('button', { name: /Seleccionar mánager: Elige un mánager/ }).click();
  await page.getByRole('combobox', { name: 'Buscar seleccionar mánager' }).fill('zzzz-no-result');
  await expect(page.getByText('No hay mánagers que coincidan')).toBeVisible();
  await page.getByRole('combobox', { name: 'Buscar seleccionar mánager' }).fill('');
  await page.getByRole('option').first().click();
  await expect(page.getByText('Tu elección:').first()).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('button', { name: /Seleccionar mánager: Elige un mánager/ })
  ).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'light' }));
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('heading', { name: 'Predicciones de temporada' })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('season-predictions-light.png'),
    fullPage: true,
  });
});
