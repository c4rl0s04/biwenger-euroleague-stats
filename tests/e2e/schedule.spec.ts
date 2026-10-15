import { waitForScreenshotPaint } from './screenshot-ready';
import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { assertFixtureTarget } from '../../scripts/e2e/safety.mjs';

test('Schedule preserves original read screens and map navigation', async ({ page }, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  // Keep unrelated asynchronous shell news from shifting the overview screenshot.
  await page.route('**/api/news', (route) => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('https://cdn.biwenger.com/i/t/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: readFileSync('public/icons/icon-192.png') })
  );
  await page.route('**/api/users/lineup', () => {
    throw new Error('Schedule read verification must never submit a lineup');
  });
  await page.goto('/login?callbackUrl=%2Fschedule');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  await expect(
    page.getByRole('heading', { name: phone ? 'Horario' : 'Horario Jugadores', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Auto-Alinear', exact: true })).toBeVisible();
  await expect(page.locator('a[href="/player/99101"]').first()).toBeVisible();
  const capture = async (name: string) => {
    if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
      return;
    await waitForScreenshotPaint(page);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: phone,
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  };
  if (!phone) await capture('schedule-overview');
  if (phone) {
    await expect(page.locator('.schedule-mobile-day')).toHaveCount(1);
    await expect(page.locator('.schedule-mobile-summary')).toContainText('24');
    await expect(page.locator('.schedule-mobile-chip').first()).toContainText('Fixture Guard');
    await expect(page.locator('.schedule-mobile-teams a').first()).toHaveAttribute(
      'href',
      /\/team\/\d+/
    );
    const roundLink = page
      .getByRole('navigation', { name: 'Seleccionar jornada' })
      .getByRole('link')
      .first();
    await expect(roundLink).toHaveAttribute('aria-current', 'page');
    await roundLink.click();
    await expect(page).toHaveURL(/roundId=/);
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ['dark', 'light']) {
        await page.evaluate(
          (value) => document.documentElement.setAttribute('data-theme', value),
          theme
        );
        await waitForScreenshotPaint(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true);
        await expect(page.locator('.schedule-mobile-chip').first()).toBeVisible();
        expect(
          await page
            .locator('.schedule-mobile-player-copy strong')
            .first()
            .evaluate((element) => getComputedStyle(element).color)
        ).toBe(
          await page
            .locator('.schedule-mobile-match time')
            .first()
            .evaluate((element) => getComputedStyle(element).color)
        );
        await page.screenshot({
          path: info.outputPath(`schedule-${width}-${theme}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }
    }
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.setViewportSize(info.project.use.viewport!);
    await capture('schedule-overview');
    await page.locator('.schedule-mobile-teams a').first().click();
    await expect(page).toHaveURL(/\/team\/\d+$/);
    await page.goBack();
    await page.locator('.schedule-mobile-chip').first().click();
    await expect(page).toHaveURL(/\/player\/99101$/);
    await page.goBack();
    const mapLink = page.locator('a.mobile-section-link[href="/schedule/map"]');
    await expect(mapLink).toBeVisible();
    await mapLink.click();
    await expect(page).toHaveURL(/\/schedule\/map$/);
    await expect(
      page.getByRole('heading', { name: 'Mapa de partidos', exact: true })
    ).toBeVisible();
    await capture('schedule-map');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  );
});

test('Schedule reveals round 6 on load and follows round navigation without vertical scrolling', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  test.skip(
    info.project.name.startsWith('desktop') || info.project.name.startsWith('tablet'),
    'Phone-only round rail.'
  );
  const connectionString = process.env.E2E_DATABASE_URL;
  assertFixtureTarget(connectionString, process.env);
  const client = new pg.Client({ connectionString });
  await client.connect();
  let ids: number[] = [];
  try {
    ids = (
      await client.query<{ id: number }>(
        `INSERT INTO matches (season_id,id,round_id,round_name,home_id,away_id,date,status)
       SELECT '2025-26',9987000+n,n,'Jornada '||n,9901,9902,
              '2025-10-01T18:00:00Z'::timestamp + n * interval '7 days','scheduled'
       FROM generate_series(2,12) n RETURNING id`
      )
    ).rows.map((row) => row.id);
    await page.route('https://cdn.biwenger.com/i/t/*.png', (route) =>
      route.fulfill({ contentType: 'image/png', body: readFileSync('public/icons/icon-192.png') })
    );
    await page.goto('/login?callbackUrl=%2Fschedule%3FroundId%3D6');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/schedule\?roundId=6$/);
    const rail = page.getByRole('navigation', { name: 'Seleccionar jornada' });
    const expectActiveVisible = async (label: string) => {
      await expect(rail.locator('[aria-current="page"]')).toHaveText(label);
      await expect
        .poll(() =>
          rail.evaluate((element) => {
            const active = element.querySelector('[aria-current="page"]')!.getBoundingClientRect();
            const bounds = element.getBoundingClientRect();
            return active.left >= bounds.left && active.right <= bounds.right;
          })
        )
        .toBe(true);
    };
    await expectActiveVisible('J6');
    expect(await rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await rail.getByRole('link', { name: 'J12', exact: true }).click();
    await expect(page).toHaveURL(/roundId=12$/);
    await expectActiveVisible('J12');
    await page.reload();
    await expectActiveVisible('J12');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await rail.getByRole('link', { name: 'J1', exact: true }).click();
    await expect(page).toHaveURL(/roundId=1$/);
    await expectActiveVisible('J1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
  } finally {
    if (ids.length)
      await client.query("DELETE FROM matches WHERE season_id='2025-26' AND id=ANY($1::int[])", [
        ids,
      ]);
    await client.end();
  }
});
