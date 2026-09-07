import type { Page, TestInfo } from 'playwright/test';
import { test, expect } from './fixtures';

async function capture(page: Page, info: TestInfo, name: string) {
  // Original macOS references; Linux still exercises all semantic contracts.
  if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
    return;
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    animations: 'disabled',
    timeout: 60000,
    stylePath: 'tests/e2e/screenshot.css',
  });
}

test('Rounds preserves historical analysis and phone section navigation', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic league fixture.');
  await page.goto('/login?callbackUrl=%2Frounds%3FroundId%3D1');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/rounds\?roundId=1$/);
  await expect(page.getByRole('heading', { name: 'Jornadas', exact: true }).first()).toBeVisible();
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    await expect(page.getByText('Tus puntos', { exact: true })).toBeVisible();
    await expect(page.getByText('Fixture Contributor 01', { exact: true }).first()).toBeVisible();
    await capture(page, info, 'rounds-overview');
    for (const section of ['lineup', 'stats', 'history', 'comparison']) {
      await page.locator(`a[href="/rounds/1/${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/rounds/1/${section}$`));
      await expect(page.getByText('Detalle', { exact: true })).toBeVisible();
      await capture(page, info, `rounds-${section}`);
      await page.locator('a[href="/rounds?roundId=1"]').first().click();
      await expect(page).toHaveURL(/\/rounds\?roundId=1$/);
    }
  } else {
    await expect(
      page.getByRole('img', { name: 'Fixture Contributor 01', exact: true }).first()
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Panel de Jornada', { exact: true })).toBeVisible();
    await capture(page, info, 'rounds-overview');
    await page.getByRole('button', { name: 'Mi Ideal', exact: true }).click();
    await expect(page.getByText('Mi Alineación Perfecta', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Global', exact: true }).click();
    await expect(page.getByText('Quinteto Ideal Jornada', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Alineación', exact: true }).click();
    await page
      .getByText('Quinteto Inicial', { exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await capture(page, info, 'rounds-court');
    await expect(
      page.getByRole('heading', { name: 'Historial de Rendimiento', exact: true })
    ).toBeVisible();
    await page
      .getByRole('heading', { name: 'Historial de Rendimiento', exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await capture(page, info, 'rounds-history');
    await expect(
      page.getByRole('heading', { name: 'Comparativa de Liga', exact: true })
    ).toBeVisible();
    await page
      .getByRole('heading', { name: 'Comparativa de Liga', exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await capture(page, info, 'rounds-comparison');
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);
});
