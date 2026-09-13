import pg from 'pg';
import { assertFixtureTarget } from '../../scripts/e2e/safety.mjs';
import { test, expect } from './fixtures';

test('Playoffs preserves ranking, phone detail and both desktop media states', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  const connectionString = process.env.E2E_DATABASE_URL;
  assertFixtureTarget(connectionString, process.env);
  const client = new pg.Client({ connectionString });
  await client.connect();
  const ids: Record<string, number[]> = {};
  try {
    // Scoped synthetic rows; preserve every other feature's shared fixture.
    ids.playoff_predictions = (
      await client.query<{ id: number }>(
        "INSERT INTO playoff_predictions (season_id,user_id,stage,match_id,predicted_winner_id) VALUES ('2025-26','99001','quarter','E2E-QF-1',9901),('2025-26','99002','quarter','E2E-QF-1',9902) RETURNING id"
      )
    ).rows.map((row) => row.id);
    ids.playoff_results = (
      await client.query<{ id: number }>(
        "INSERT INTO playoff_results (season_id,stage,match_id,winner_id,is_completed) VALUES ('2025-26','quarter','E2E-QF-1',9901,true) RETURNING id"
      )
    ).rows.map((row) => row.id);
    ids.user_playoff_media = (
      await client.query<{ id: number }>(
        "INSERT INTO user_playoff_media (season_id,user_id,prediction_image_url) VALUES ('2025-26','99001','/icons/icon-192.png') RETURNING id"
      )
    ).rows.map((row) => row.id);
    await page.goto('/login?callbackUrl=%2Fplayoffs');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/playoffs$/);
    const phone =
      (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
    await expect(
      page.getByRole('heading', { name: phone ? 'Playoffs' : 'Playoffs & Play-in', exact: true })
    ).toBeVisible();
    const capture = async (name: string) => {
      // References originate at 49bd8334, never from migrated application output.
      if (
        process.platform !== 'darwin' ||
        !['iphone-13', 'desktop-1440'].includes(info.project.name)
      )
        return;
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: phone,
        animations: 'disabled',
        timeout: 60000,
        stylePath: 'tests/e2e/screenshot.css',
      });
    };
    await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
    await capture('playoffs-overview');
    if (phone) {
      await page.locator('a[href="/playoffs/predictions/99001"]').click();
      await expect(page).toHaveURL(/\/playoffs\/predictions\/99001$/);
      await expect(page.getByText('1/1', { exact: true })).toBeVisible();
      await expect(page.getByText('100%', { exact: true })).toBeVisible();
      await expect(page.getByText('Registro 1', { exact: true })).toBeVisible();
      await capture('playoffs-prediction-detail');
      await page.getByRole('link', { name: 'Volver a Fixture Manager', exact: true }).click();
    } else {
      for (const [name, hasImage] of [
        ['Fixture Manager', true],
        ['Fixture Rival', false],
      ] as const) {
        await page.getByRole('row').filter({ hasText: name }).getByRole('button').click();
        const modal = page
          .locator('.fixed.inset-0')
          .filter({ hasText: 'Predicciones de Playoffs' });
        await expect(modal).toBeVisible();
        if (hasImage) {
          await expect(modal.getByRole('img', { name: `Predicción de ${name}` })).toBeVisible();
          await expect(modal.getByText('Fixture Madrid', { exact: true })).toBeVisible();
        } else
          await expect(modal.getByText('Sin imagen disponible', { exact: true })).toBeVisible();
        await capture(hasImage ? 'playoffs-media' : 'playoffs-no-media');
        await modal.getByRole('button').click();
        await expect(modal).not.toBeVisible();
      }
    }
  } finally {
    // Identifiers come exclusively from the three fixed INSERT targets above.
    for (const table of ['playoff_predictions', 'playoff_results', 'user_playoff_media']) {
      if (ids[table]?.length)
        await client.query(`DELETE FROM ${table} WHERE id = ANY($1::int[])`, [ids[table]]);
    }
    await client.end();
  }
});
