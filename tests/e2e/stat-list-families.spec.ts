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

test('dashboard keeps ranked players, contextual form and transfer activity distinct', async ({
  page,
}, info) => {
  const player = {
    id: 99101,
    player_id: 99101,
    name: 'List Fixture Player with a long display name',
    team: 'Fixture Madrid',
    position: 'Base',
    owner_id: '99001',
    owner_name: 'Fixture Manager',
    owner_color_index: 1,
    average: 0,
    points: 0,
    value: 0,
    avg_value: 0,
    games_played: 2,
    avg_points: 0,
    recent_scores: '0,12,-3',
    form_label: 'En forma',
    avg_recent_points: 0,
  };
  const mock = async (path: string, data: unknown) =>
    page.route(path, (route) => route.fulfill({ json: { success: true, data } }));
  await mock('**/api/dashboard/top-players', [player]);
  await mock('**/api/dashboard/mvps', [player]);
  await mock('**/api/stats/leaders?**', [player]);
  await mock('**/api/dashboard/top-form', [player]);
  await mock('**/api/dashboard/captain-suggest?**', [player]);
  await mock('**/api/dashboard/recent-activity?**', {
    recentTransfers: [
      {
        id: 1,
        player_id: 99101,
        player_name: 'Activity Fixture Player',
        precio: 0,
        timestamp: 1760000000,
        vendedor_id: '99001',
        vendedor: 'Fixture Seller',
        vendedor_color_index: 1,
        comprador_id: '99002',
        comprador: 'Fixture Buyer',
        comprador_color_index: 2,
      },
      {
        id: 2,
        player_id: 99101,
        player_name: 'Market Fixture Player',
        precio: 12,
        timestamp: 1760000000,
        vendedor_id: null,
        vendedor: 'Mercado',
        comprador_id: '99001',
        comprador: 'Fixture Buyer',
        comprador_color_index: 1,
      },
    ],
    priceChanges: [],
    recentRecords: [],
    personalizedAlerts: [],
  });
  await login(page, '/dashboard');
  for (const theme of ['dark', 'light']) {
    await page
      .locator('html')
      .evaluate((element, value) => element.setAttribute('data-theme', value), theme);
    const top = page.locator('.stat-card').filter({ hasText: 'Top Jugadores' });
    await top.scrollIntoViewIfNeeded();
    const ranking = top.locator('[data-stat-list="player-ranking"]');
    await expect(ranking.getByRole('link', { name: player.name })).toHaveAttribute(
      'href',
      '/player/99101'
    );
    await expect(ranking.getByRole('listitem')).toHaveCount(1);
    await expect(ranking).toContainText('0 pts');
    const form = page.locator('[data-stat-list="topform"]');
    await form.scrollIntoViewIfNeeded();
    await expect(form).toContainText('12');
    await expect(form).toContainText('-3');
    await expect(form.getByRole('link', { name: 'Fixture Manager' })).toHaveAttribute(
      'href',
      '/user/99001'
    );
    const activity = page.locator('[data-stat-list="transfer-activity"]');
    await activity.scrollIntoViewIfNeeded();
    const transfer = activity.getByRole('listitem').first();
    await expect(transfer.getByRole('link', { name: 'Activity Fixture Player' })).toHaveAttribute(
      'href',
      '/player/99101'
    );
    await expect(transfer.getByRole('link', { name: 'Fixture Seller' })).toHaveAttribute(
      'href',
      '/user/99001'
    );
    await expect(transfer.getByRole('link', { name: 'Fixture Buyer' })).toHaveAttribute(
      'href',
      '/user/99002'
    );
    await expect(transfer).toContainText('0€');
    await expect(activity.getByRole('link', { name: 'Mercado' })).toHaveCount(0);
    await transfer.getByRole('link', { name: 'Fixture Seller' }).focus();
    await expect(transfer.getByRole('link', { name: 'Fixture Seller' })).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
    await waitForScreenshotPaint(page);
    await activity.screenshot({ path: info.outputPath(`transfer-activity-${theme}.png`) });
    await ranking.screenshot({ path: info.outputPath(`player-ranking-${theme}.png`) });
  }
});
