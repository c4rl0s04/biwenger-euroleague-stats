import { test, expect } from './fixtures';
import type { Page } from 'playwright/test';
import { waitForScreenshotPaint } from './screenshot-ready';

async function login(page: Page, route: string) {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(route)}`);
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`${route}$`));
}

test.beforeEach(async ({}, info) => {
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE || !info.project.name.startsWith('desktop'),
    'Desktop lists use the synthetic league.'
  );
});

test('standings retains compact rankings and distinct keyboard-accessible breakdowns', async ({
  page,
}, info) => {
  const manager = {
    user_id: '99001',
    name: 'List Fixture Manager',
    user_name: 'List Fixture Manager',
    icon: null,
    color_index: 1,
    user_color_index: 1,
  };
  await page.route('**/api/standings/initial-squad-stats', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          retainedRanking: [{ ...manager, total_points: 0, players_contributed: 1 }],
          retainedBreakdown: [
            { user_name: manager.name, player_name: 'List Contributor', points: 12 },
          ],
          bestDraftPerUser: [],
          regretRanking: [],
          loyaltyRanking: [],
          potentialRanking: [],
        },
      },
    })
  );
  await page.route('**/api/standings/advanced?type=volatility', (route) =>
    route.fulfill({ json: { success: true, data: [{ ...manager, std_dev: 0, avg_points: 50 }] } })
  );
  await page.route('**/api/standings/bottlers', (route) =>
    route.fulfill({
      json: { success: true, data: [{ ...manager, bottler_score: 7, seconds: 2, thirds: 1 }] },
    })
  );
  await login(page, '/standings');
  for (const theme of ['dark', 'light']) {
    await page
      .locator('html')
      .evaluate((element, value) => element.setAttribute('data-theme', value), theme);
    const draft = page.locator('[data-stat-list="draft-breakdown"]');
    await draft.scrollIntoViewIfNeeded();
    await expect(draft.getByRole('link')).toHaveAttribute('href', '/user/99001');
    const trigger = draft.getByRole('button', {
      name: `Aportación por jugador de ${manager.name}`,
    });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const panel = page.locator('[popover]:popover-open');
    await expect(panel).toContainText('List Contributor');
    await expect(panel).toContainText('12 pts');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    const volatility = page.locator('[data-stat-list="volatility"]');
    await volatility.scrollIntoViewIfNeeded();
    await expect(volatility).toContainText('Media: 50');
    const bottler = page.locator('#bottler-card [data-stat-list="manager"]');
    await bottler.scrollIntoViewIfNeeded();
    await expect(bottler).toContainText('2x 2º');
    await expect(bottler).toContainText('1x 3er');
    await expect(bottler.getByRole('link')).toHaveAttribute('href', '/user/99001');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
    await waitForScreenshotPaint(page);
    await page
      .locator('#bottler-card')
      .screenshot({ path: info.outputPath(`manager-ranking-${theme}.png`) });
  }
});
