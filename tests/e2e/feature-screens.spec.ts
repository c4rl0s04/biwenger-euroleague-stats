import { test, expect } from './fixtures';

test('migrated feature screens preserve fixture data and layout', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE,
    'Requires the synthetic league from test:e2e:local.'
  );
  await page.goto('/login?callbackUrl=%2Fmatches');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/matches$/);
  await expect(page.getByText('Fixture Madrid', { exact: true }).first()).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText('Fixture Athens', { exact: true }).first()).toBeVisible();
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) await expect(page.getByText('84 – 79', { exact: true })).toBeVisible();
  else {
    await expect(page.getByText('84', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('79', { exact: true }).first()).toBeVisible();
  }
  await page.evaluate(() => document.fonts.ready);
  if (['iphone-13', 'desktop-1440'].includes(testInfo.project.name)) {
    await expect(page).toHaveScreenshot('matches.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  }
  await page.locator('a[href="/team/9901"]').first().click();
  await expect(page).toHaveURL(/\/team\/9901$/);
  await expect(
    page.getByRole('heading', { name: 'Fixture Madrid', exact: true }).first()
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (['iphone-13', 'desktop-1440'].includes(testInfo.project.name)) {
    await expect(page).toHaveScreenshot('team.png', {
      fullPage: true,
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  }
  if (phone) await page.locator('a[href="/team/9901/roster"]').click();
  await expect(page.getByText('Fixture Guard', { exact: true }).first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);
});
