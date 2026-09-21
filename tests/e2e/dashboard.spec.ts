import { test, expect } from './fixtures';

test('Dashboard overview and phone sections retain their read experience', async ({ page }) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  await page.goto('/login?callbackUrl=%2Fdashboard');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
    for (const section of ['season', 'comparison', 'next-round', 'market', 'league']) {
      await page.locator('a[href="/dashboard/' + section + '"]').click();
      await expect(page).toHaveURL(new RegExp('/dashboard/' + section + '$'));
      await expect(
        page.getByText('Una vista enfocada para decidir rápido sin recorrer todo el dashboard.')
      ).toBeVisible();
      await expect(page.locator('main')).not.toContainText('Application error');
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
    }
    await expect(page.getByText('Fixture Guard', { exact: true }).first()).toBeAttached();
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
      expect(payload.data.recentRecords[0]).toMatchObject({
        type: 'highest_round',
        user_name: 'Fixture Rival',
        value: 35,
      });
      expect(payload.data.personalizedAlerts).toEqual([]);
    }
  }
  const average = await page.request.get('/api/league-average');
  expect(average.status()).toBe(200);
  expect(await average.json()).toEqual({ success: true, data: { average: 27.5 } });
});
