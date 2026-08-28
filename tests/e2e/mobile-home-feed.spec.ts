import { expect, test } from 'playwright/test';

test('phone home opens as the league activity cover', async ({ page }) => {
  test.skip(
    !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
    'Set E2E_USERNAME and E2E_PASSWORD to exercise authenticated routes.'
  );

  await page.goto('/login?callbackUrl=%2F');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/$/);

  const presentation = await page.locator('[data-presentation]').getAttribute('data-presentation');
  if (presentation !== 'phone') {
    await expect(page.getByRole('heading', { name: /Páginas Disponibles/i })).toBeVisible();
    return;
  }

  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Accesos rápidos' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Filtrar actividad' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Actividad reciente' })).toBeVisible();

  await page.getByRole('button', { name: 'Fichajes' }).click();
  await expect(page).toHaveURL(/activity=transfers/);
  await expect(page.getByRole('button', { name: 'Fichajes' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  await page.getByRole('button', { name: 'Todos' }).click();
  await expect(page).not.toHaveURL(/activity=/);

  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(Math.max(overflow.document, overflow.body)).toBeLessThanOrEqual(overflow.viewport + 1);
});
