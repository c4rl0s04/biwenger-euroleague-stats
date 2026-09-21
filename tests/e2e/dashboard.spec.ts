import { test, expect } from './fixtures';
import { verifyDashboardFallbacks } from './dashboard-fallbacks';

test('Dashboard overview and phone sections retain their read experience', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  await page.goto('/login?callbackUrl=%2Fdashboard');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  const capture = async (name: string, sectionId?: string) => {
    if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
      return;
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    const options = {
      animations: 'disabled' as const,
      timeout: 60000,
      // News order is intentionally randomized by the existing server service.
      mask: [page.locator('.mobile-news-headline')],
      stylePath: 'tests/e2e/screenshot.css',
    };
    if (sectionId) await expect(page.locator(sectionId)).toHaveScreenshot(`${name}.png`, options);
    else await expect(page).toHaveScreenshot(`${name}.png`, { ...options, fullPage: true });
  };
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
    await capture('dashboard-phone');
    const news = page.locator('.mobile-news-strip');
    if (await news.count()) {
      await news.locator('summary').click();
      await expect(news).toHaveAttribute('open', '');
      await expect(news.locator('li').first()).toBeVisible();
      await news.locator('summary').click();
    }
    for (const section of ['season', 'comparison', 'next-round', 'market', 'league']) {
      await page.locator('a[href="/dashboard/' + section + '"]').click();
      await expect(page).toHaveURL(new RegExp('/dashboard/' + section + '$'));
      await expect(
        page.getByText('Una vista enfocada para decidir rápido sin recorrer todo el dashboard.')
      ).toBeVisible();
      await expect(page.locator('main')).not.toContainText('Application error');
      await capture(`dashboard-phone-${section}`);
      await page
        .locator('a[href="/dashboard"]')
        .filter({ hasText: /Dashboard|Volver/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/dashboard$/);
    }
  } else {
    for (const title of [
      'Mi Temporada',
      'Comparativa',
      'Próxima Jornada',
      'Mercado y Jugadores',
      'Rendimiento de la Liga',
      'Curiosidades',
    ]) {
      const heading = page.getByRole('heading', { name: title, exact: true });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
      const section = heading.locator('xpath=ancestor::section');
      await expect(section.locator('.animate-pulse')).toHaveCount(0);
      const id = await section.getAttribute('id');
      // Framer Motion's JS springs are not stopped by Playwright's CSS animation option.
      if (id === 'mi-temporada')
        await expect(section.getByText('1.500.000€', { exact: true })).toBeVisible();
      await capture(`dashboard-${id}`, `#${id}`);
    }
    await expect(page.getByText('Fixture Guard', { exact: true }).first()).toBeAttached();
    const rebounds = page.waitForResponse(
      (response) =>
        response.url().includes('/api/stats/leaders?type=rebounds') && response.status() === 200
    );
    await page.getByRole('button', { name: 'REB', exact: true }).click();
    await rebounds;
    await expect(page.getByRole('button', { name: 'REB', exact: true })).toBeEnabled();
  }
  for (const endpoint of [
    'birthdays',
    'rising-stars',
    'top-players',
    'top-form',
    'market-opportunities',
    'mvps',
    'next-round',
    'ideal-lineup',
    'recent-activity',
    'leader-gap',
  ]) {
    const response = await page.request.get('/api/dashboard/' + endpoint);
    expect(response.status(), endpoint).toBe(200);
    const payload = await response.json();
    expect(payload.success, endpoint).toBe(true);
    if (endpoint === 'mvps') {
      expect(payload.data).toHaveLength(5);
      expect(payload.data[0]).toMatchObject({
        player_id: 99201,
        name: 'Fixture Contributor 01',
        points: 19,
      });
    }
    if (endpoint === 'ideal-lineup') {
      expect(payload.data.total_points).toBe(54);
      expect(payload.data.lineup.map((player: { player_id: number }) => player.player_id)).toEqual([
        99201, 99202, 99203,
      ]);
    }
    if (endpoint === 'next-round') {
      expect(payload.data.nextRound).toMatchObject({
        round_id: 1,
        round_name: 'Jornada 1',
        start_date: '2025-10-01T18:00:00.000Z',
      });
      expect(payload.data.nextRound.matches[0]).toMatchObject({
        home_team: 'Fixture Madrid',
        away_team: 'Fixture Athens',
        home_score: 84,
        away_score: 79,
      });
    }
    if (endpoint === 'leader-gap')
      expect(payload.data).toMatchObject({ user_points: 55, gap: 0, is_leader: true });
    if (endpoint === 'recent-activity') {
      expect(response.headers()['cache-control']).toBe(
        'public, max-age=60, stale-while-revalidate=60'
      );
      expect(payload.data.recentRecords[0]).toMatchObject({
        type: 'highest_round',
        user_name: 'Fixture Rival',
        value: 35,
      });
      expect(payload.data.personalizedAlerts).toEqual([]);
    }
  }
  const personalizedActivity = await page.request.get('/api/dashboard/recent-activity?userId=1');
  expect(personalizedActivity.status()).toBe(200);
  expect((await personalizedActivity.json()).success).toBe(true);
  expect(personalizedActivity.headers()['cache-control']).toBe(
    'private, no-store, max-age=0, must-revalidate'
  );
  const average = await page.request.get('/api/league-average');
  expect(average.status()).toBe(200);
  expect(await average.json()).toEqual({ success: true, data: { average: 27.5 } });
  if (info.project.name === 'desktop-1440') await verifyDashboardFallbacks(page.context());
});
