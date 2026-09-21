import { expect, type BrowserContext } from 'playwright/test';

/** Isolated negative case: the normal page's strict error guards remain unchanged. */
export async function verifyDashboardFallbacks(context: BrowserContext) {
  const page = await context.newPage();
  const errors: string[] = [];
  const exceptions: string[] = [];
  const failedApis: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => exceptions.push(error.message));
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/api/') && response.status() >= 400)
      failedApis.push(response.url());
  });
  await page.route('**/_vercel/insights/script.js*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    })
  );
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markRequested = () => {};
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  await page.route('**/api/dashboard/top-form', async (route) => {
    markRequested();
    await gate;
    await route.fulfill({ json: { success: false, error: 'Synthetic Dashboard read failure' } });
  });
  await page.route('**/api/dashboard/rising-stars', (route) =>
    route.fulfill({
      json: { success: true, data: [] },
    })
  );
  try {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    const next = page.locator('#proxima-jornada');
    await next.scrollIntoViewIfNeeded();
    await requested;
    await expect(next.locator('.stat-card.animate-pulse').first()).toBeVisible();
    release();
    const form = next.locator('.stat-card').filter({ hasText: 'Top Forma' });
    await expect(form.getByText('No hay datos disponibles', { exact: true })).toBeVisible();
    await expect(form.locator('.animate-pulse')).toHaveCount(0);
    const rising = page.locator('.stat-card').filter({ hasText: 'Estrellas Emergentes' });
    await rising.scrollIntoViewIfNeeded();
    await expect(rising.getByText('No hay datos suficientes', { exact: true })).toBeVisible();
    const personal = page.locator('#mi-temporada');
    await personal.scrollIntoViewIfNeeded();
    await expect(personal).toContainText('55');
    expect(exceptions).toEqual([]);
    expect(failedApis).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Synthetic Dashboard read failure');
  } finally {
    release();
    await page.close();
  }
}
