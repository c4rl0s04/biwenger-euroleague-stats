import type { Page, TestInfo } from 'playwright/test';
import { test, expect } from './fixtures';

async function capture(page: Page, info: TestInfo, name: string) {
  // Original references must be captured at 11c78c0e, before the statistics extraction.
  // Linux references require the pinned Linux runner, not regenerated candidate output.
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
}

test('Tournament catalogue, league, cup and phone sections preserve their read experience', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  // The legacy tournament image code prefixes relative fixture icons with this CDN.
  // Serve that one synthetic icon locally; keep browser/API error guards unchanged.
  await page.route('https://cdn.biwenger.com//icons/icon-192.png', (route) =>
    route.fulfill({ path: 'public/icons/icon-192.png', contentType: 'image/png' })
  );
  await page.goto('/login?callbackUrl=%2Ftournaments');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/tournaments$/);
  await expect(page.getByRole('heading', { name: 'Torneos', exact: true })).toBeVisible();
  await expect(page.locator('a[href="/tournaments/99301"]').first()).toBeVisible();
  await expect(page.locator('a[href="/tournaments/99302"]').first()).toBeVisible();
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (!phone) {
    await expect(page.locator('#hall-of-fame')).toContainText('Fixture Manager');
    await expect(page.locator('#global-stats')).toContainText('Fixture Rival');
  }
  await capture(page, info, 'tournaments-catalogue');
  for (const [id, title] of [
    ['99301', 'Fixture Profile League'],
    ['99302', 'Fixture Profile Cup'],
  ]) {
    await page.goto(`/tournaments/${id}`);
    await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
    if (phone) {
      await expect(page.locator(`a[href="/tournaments/${id}/standings"]`)).toBeVisible();
      await capture(page, info, `tournament-${id}`);
      for (const [section, heading] of [
        ['standings', 'Clasificación'],
        ['bracket', 'Cuadro'],
        ['results', 'Resultados'],
      ]) {
        await page.locator(`a[href="/tournaments/${id}/${section}"]`).click();
        await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/${section}$`));
        await expect(
          page.getByRole('heading', { name: heading, exact: true }).first()
        ).toBeVisible();
        if (section === 'standings' && id === '99301') {
          await expect(page.locator('a[href="/user/99001"]').first()).toBeVisible();
        }
        await capture(page, info, `tournament-${id}-${section}`);
        await page.goto(`/tournaments/${id}`);
      }
    } else {
      await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Resultados', exact: true })).toBeVisible();
      await capture(page, info, `tournament-${id}`);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
  }
});
