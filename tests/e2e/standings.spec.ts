import type { Page, TestInfo } from 'playwright/test';
import { test, expect } from './fixtures';

async function capture(page: Page, info: TestInfo, name: string) {
  // References are captured from unchanged 38bf2de4 on macOS, never candidate output.
  if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
    return;
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot(name + '.png', {
    fullPage: false,
    animations: 'disabled',
    timeout: 60000,
    stylePath: 'tests/e2e/screenshot.css',
  });
}

test('Standings overview and phone sections retain their read experience', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  await page.goto('/login?callbackUrl=%2Fstandings');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/standings$/);
  await expect(page.getByRole('heading', { name: 'Clasificación', exact: true })).toBeVisible();
  await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    await capture(page, info, 'standings-overview');
    const sections = [
      ['progression', 'Evolución'],
      ['rounds', 'Jornadas'],
      ['draft', 'Draft inicial'],
      ['form', 'Estado de forma'],
      ['performance', 'Rendimiento'],
      ['alternatives', 'Clasificaciones'],
      ['curiosities', 'Curiosidades'],
      ['captains', 'Capitanes'],
    ];
    for (const [section, title] of sections) {
      await page.locator(`a[href="/standings/${section}"]`).click();
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByText('Datos destacados', { exact: true })).toBeVisible();
      expect(await page.locator('.mobile-record-index').count()).toBeLessThanOrEqual(20);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
      ).toBe(true);
      if (section === 'captains') {
        await expect(page.locator('a[href="/user/99001"]').first()).toBeVisible();
      }
      await capture(page, info, `standings-${section}`);
      await page.getByRole('link', { name: 'Volver a Clasificación' }).click();
      await expect(page.getByRole('heading', { name: 'Clasificación', exact: true })).toBeVisible();
    }
  } else {
    await page.locator('#general-standings').scrollIntoViewIfNeeded();
    await expect(
      page
        .locator('#general-standings')
        .getByText('Fixture Rival', { exact: true })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    await page
      .locator('#general-standings')
      .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await capture(page, info, 'standings-ranking');
    const progression = page.locator('#progression');
    await progression.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    const chart = progression.locator('.recharts-wrapper').first();
    await expect(chart.locator('.recharts-line-curve')).toHaveCount(2);
    await expect
      .poll(async () =>
        chart
          .locator('.recharts-line-curve')
          .evaluateAll((lines) => lines.every((line) => (line.getAttribute('d')?.length ?? 0) > 10))
      )
      .toBe(true);
    await capture(page, info, 'standings-progression');
    await progression.getByRole('button', { name: 'Fixture Manager', exact: true }).first().click();
    await expect(chart.locator('.recharts-line-curve')).toHaveCount(1);
    await progression.getByRole('button', { name: 'All', exact: true }).first().click();
    await expect(chart.locator('.recharts-line-curve')).toHaveCount(2);
  }
});
