import { test, expect } from 'playwright/test';

test('Mobile offers distinguishes temporary failures, reconnect and populated offers', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE || info.project.name !== 'iphone-13');
  const deadline = '2026-11-30T17:30:00.000Z';
  let requests = 0;
  await page.route('**/api/users/lineup', (route) => {
    requests++;
    if (requests === 1) return route.abort();
    if (requests === 3) {
      return route.fulfill({
        status: 409,
        json: { success: false, code: 'BIWENGER_RECONNECT_REQUIRED' },
      });
    }
    return route.fulfill({
      json: {
        success: true,
        data: { offers: [{ id: 1, amount: 1234567, until: Date.parse(deadline) / 1000 }] },
      },
    });
  });
  await page.goto('/login?callbackUrl=%2Flineup%2Foffers');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('No se pudieron cargar las ofertas.')).toBeVisible();
  await expect(page.getByText('No tienes ofertas pendientes.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('1.234.567 €')).toBeVisible();
  await expect(page.locator(`time[datetime="${deadline}"]`)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Renovar conexión con Biwenger' })).toHaveAttribute(
    'href',
    '/settings/biwenger'
  );
});
