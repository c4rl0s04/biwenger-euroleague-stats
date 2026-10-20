import type { Locator, Page } from 'playwright/test';
import { test, expect } from './fixtures';

async function expectPinnedSidebar(page: Page, sidebar: Locator) {
  // Guarantee meaningful document scrolling even with a small synthetic league.
  await page.locator('#main-content').evaluate((element) => {
    element.style.minHeight = '3000px';
  });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 1200);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  await expect(async () => {
    const header = await page.locator('header.app-top-header').boundingBox();
    const menu = await sidebar.boundingBox();
    expect(header).not.toBeNull();
    expect(menu).not.toBeNull();
    expect(Math.abs(menu!.y - (header!.y + header!.height))).toBeLessThan(2);
  }).toPass();
}

test('sidebar remains pinned after closed drawers mount and after route navigation', async ({
  page,
}, info) => {
  test.skip(!['desktop-1440', 'tablet-768'].includes(info.project.name));
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  await page.goto('/login?callbackUrl=%2Fplayers');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/players$/);
  const sidebar = page.getByRole('complementary', { name: 'Navegación principal' });
  await expect(sidebar).toBeVisible();
  await expectPinnedSidebar(page, sidebar);
  await sidebar.getByRole('link', { name: 'Clasificación', exact: true }).click();
  await expect(page).toHaveURL(/\/standings$/);
  await expectPinnedSidebar(page, sidebar);
});
