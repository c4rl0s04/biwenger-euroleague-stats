import pg from 'pg';
import { assertFixtureTarget } from '../../scripts/e2e/safety.mjs';
import { test, expect } from './fixtures';

test('Predictions preserves populated rankings and phone sections', async ({ page }, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  const connectionString = process.env.E2E_DATABASE_URL;
  assertFixtureTarget(connectionString, process.env);
  const client = new pg.Client({ connectionString });
  await client.connect();
  const inserted: number[] = [];
  try {
    // Test-local rows leave the shared Home and other feature fixtures unchanged.
    const rows = await client.query<{ id: number }>(
      "INSERT INTO porras (season_id,user_id,round_id,round_name,result,aciertos) VALUES ('2025-26','99001',1,'Jornada 1','1',1),('2025-26','99002',1,'Jornada 1','2',0) RETURNING id"
    );
    inserted.push(...rows.rows.map((row) => row.id));
    await page.goto('/login?callbackUrl=%2Fpredictions');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/predictions$/);
    await expect(page.getByRole('heading', { name: 'Porras', exact: true })).toBeVisible();
    await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
    const phone =
      (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
    const capture = async (name: string) => {
      // Capture references only from unchanged cc65f916 application source.
      // Linux reference capture remains a separate original-code verification gate.
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
    await capture('predictions-overview');
    if (phone) {
      for (const [section, title] of [
        ['evolution', 'Evolución'],
        ['ranking', 'Ranking'],
        ['teams', 'Equipos'],
        ['history', 'Historial'],
      ]) {
        await page.locator(`a[href="/predictions/${section}"]`).click();
        await expect(page).toHaveURL(new RegExp(`/predictions/${section}$`));
        await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
        await capture(`predictions-${section}`);
        await page.getByRole('link', { name: 'Volver a Porras', exact: true }).click();
      }
    } else {
      for (const [index, title] of [
        [0, 'Ranking Clutch'],
        [1, 'Ranking de Victorias'],
      ] as const) {
        await page.getByText('Ver ranking', { exact: true }).nth(index).click();
        const drawer = page.getByRole('dialog', { name: title });
        await expect(drawer).toBeVisible();
        await expect(drawer.getByText('Fixture Manager', { exact: true })).toBeVisible();
        await drawer.getByRole('button', { name: `Cerrar ${title}`, exact: true }).click();
        await expect(drawer).not.toBeVisible();
      }
      await expect(page.getByRole('heading', { name: 'Clasificación Detallada' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Historial Completo' })).toBeVisible();
      await expect(page.getByText('Fixture Madrid', { exact: true }).first()).toBeVisible();
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
  } finally {
    if (inserted.length)
      await client.query('DELETE FROM porras WHERE id = ANY($1::int[])', [inserted]);
    await client.end();
  }
});
