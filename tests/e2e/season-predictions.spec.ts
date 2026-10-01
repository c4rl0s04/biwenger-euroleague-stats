import pg from 'pg';
import { test as rawTest } from 'playwright/test';
import { expect, test } from './fixtures';

test.beforeEach(async () => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires disposable season data.');
  const client = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await client.connect();
  try {
    await client.query(`DELETE FROM season_prediction_submissions WHERE season_id = '2025-26';
      UPDATE season_prediction_windows SET opens_at = clock_timestamp(),
        locks_at = clock_timestamp() + interval '168 hours' WHERE season_id = '2025-26';`);
    await client.query(`UPDATE season_prediction_windows SET candidates = jsonb_set(candidates,
      '{players,0,name}', to_jsonb('Fixture Contributor With A Very Long Name For A Narrow Phone'::text))
      WHERE season_id = '2025-26'`);
  } finally {
    await client.end();
  }
});

for (const theme of ['dark', 'light'] as const) {
  test(`season predictions save, reorder and locked league view in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((preference) => localStorage.setItem('theme', preference), theme);
    await page.goto('/login?callbackUrl=%2Fseason-predictions');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/season-predictions$/);

    const phone = (await page.locator('[data-presentation="phone"]').count()) > 0;
    await expect(
      page.getByRole('heading', { name: phone ? 'Predicciones' : 'Predicciones de temporada' })
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByText('Las respuestas solo se guardan')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /clasificación de la temporada regular/ })
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );

    const picker = page
      .getByRole('button', { name: /Seleccionar jugador: Elige un jugador/ })
      .first();
    await picker.click();
    const search = page.getByRole('combobox', { name: 'Buscar seleccionar jugador' });
    await expect(search).toBeFocused();
    await search.fill('no-such-player');
    await expect(page.getByText('No hay jugadores que coincidan')).toBeVisible();
    if (phone && theme === 'dark') {
      await search.fill('Very Long Name');
      await expect(
        page.getByRole('option', { name: /Fixture Contributor With A Very Long Name/ })
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
      ).toBe(true);
    }
    await search.fill('Fixture Guard');
    await search.press('Enter');
    await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible();

    const teamRanking = page.locator('[aria-labelledby="team-ranking-title"]');
    await expect(teamRanking.getByText('Fixture Athens')).toBeVisible();
    if (phone) {
      const handle = teamRanking.getByRole('button', { name: 'Arrastrar Fixture Athens' });
      const bounds = (await handle.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      await expect(handle).toHaveCSS('touch-action', 'none');
      await expect(handle.locator('xpath=../..')).toHaveCSS('touch-action', 'pan-y');
    }
    await teamRanking.getByRole('button', { name: 'Bajar Fixture Athens' }).click();
    await expect(
      teamRanking.getByText('Fixture Athens ahora está en la posición 2.')
    ).toBeAttached();
    const raiseAthens = teamRanking.getByRole('button', { name: 'Subir Fixture Athens' });
    await raiseAthens.focus();
    await page.keyboard.press('Enter');
    await expect(
      teamRanking.getByText('Fixture Athens ahora está en la posición 1.')
    ).toBeAttached();
    await expect(
      teamRanking.getByRole('button', { name: 'Arrastrar Fixture Athens' })
    ).toBeFocused();
    await teamRanking.getByRole('button', { name: 'Bajar Fixture Athens' }).click();
    await expect(teamRanking.getByRole('button', { name: 'Borrar clasificación' })).toBeVisible();
    if (!phone && theme === 'dark') {
      const handle = teamRanking.getByRole('button', { name: 'Arrastrar Fixture Madrid' });
      const target = teamRanking.getByRole('button', { name: 'Arrastrar Fixture Athens' });
      const from = (await handle.boundingBox())!;
      const to = (await target.boundingBox())!;
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 12, { steps: 10 });
      await page.mouse.up();
      await expect(
        teamRanking.getByText('Fixture Madrid ahora está en la posición 2.')
      ).toBeAttached();
    }
    const managerRanking = page.locator('[aria-labelledby="manager-ranking-title"]');
    await managerRanking.getByRole('button', { name: 'Usar este orden' }).click();
    await page.getByRole('button', { name: 'Guardar predicciones', exact: true }).click();
    await expect(page.getByText('Predicciones guardadas.')).toBeVisible();
    await page.reload();
    await expect(
      page
        .locator('[aria-labelledby="player-total-points-title"]')
        .getByRole('button', { name: /Seleccionar jugador: Fixture Guard/ })
    ).toBeVisible();
    await expect(teamRanking.getByRole('button', { name: 'Borrar clasificación' })).toBeVisible();
    await expect(
      managerRanking.getByRole('button', { name: 'Borrar clasificación' })
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`season-predictions-${theme}.png`),
      fullPage: true,
    });

    await page
      .locator('[aria-labelledby="player-total-points-title"]')
      .getByRole('button', { name: /Borrar elección/ })
      .click();
    await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible();
    await page.getByRole('button', { name: 'Guardar predicciones', exact: true }).click();
    await expect(page.getByText('Predicciones guardadas.')).toBeVisible();

    // The server integration test covers access timing; this verifies the locked presentation.
    const client = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
    await client.connect();
    try {
      await client.query(`INSERT INTO season_prediction_submissions (season_id, user_id, answers)
        VALUES ('2025-26', '99002', '{"team-champion":{"kind":"single","id":"9901"}}'::jsonb);
        UPDATE season_prediction_windows SET locks_at = clock_timestamp()
        WHERE season_id = '2025-26'`);
    } finally {
      await client.end();
    }
    await page.reload();
    await expect(page.getByText('Tus respuestas están bloqueadas.')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Guardar predicciones', exact: true })
    ).toHaveCount(0);
    await page.getByText('Fixture Rival').last().click();
    await expect(page.getByText('Fixture Madrid').last()).toBeVisible();
    await expect(page.getByText('Sin respuesta').first()).toBeVisible();
  });
}

rawTest('save failures and stale revisions keep the draft unsaved', async ({ page }, testInfo) => {
  rawTest.skip(!process.env.BIWENGER_E2E_DISPOSABLE || testInfo.project.name !== 'desktop-1440');
  const client = new pg.Client({ connectionString: process.env.E2E_DATABASE_URL });
  await client.connect();
  try {
    await client.query(`DELETE FROM season_prediction_submissions WHERE season_id = '2025-26';
      UPDATE season_prediction_windows SET opens_at = clock_timestamp(),
        locks_at = clock_timestamp() + interval '168 hours' WHERE season_id = '2025-26'`);
    await page.goto('/login?callbackUrl=%2Fseason-predictions');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/season-predictions$/);
    await page
      .getByRole('button', { name: /Seleccionar equipo: Elige un equipo/ })
      .first()
      .click();
    await page.getByRole('option').first().click();
    await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible();
    await page.route('**/api/season-predictions/submission', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Error de prueba' }),
      })
    );
    await page.getByRole('button', { name: 'Guardar predicciones', exact: true }).click();
    await expect(page.getByText('Error de prueba')).toBeVisible();
    await page.unroute('**/api/season-predictions/submission');
    await page.getByRole('button', { name: 'Guardar predicciones', exact: true }).click();
    await expect(page.getByText('Predicciones guardadas.')).toBeVisible();
    await client.query(`UPDATE season_prediction_submissions SET revision = revision + 1
      WHERE season_id = '2025-26' AND user_id = '99001'`);
    await page
      .getByRole('button', { name: /Borrar elección/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Guardar predicciones', exact: true }).click();
    await expect(page.getByText('Tus predicciones se modificaron en otra pestaña.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recargar respuestas' })).toBeVisible();
    await client.query(`UPDATE season_prediction_windows SET opens_at = clock_timestamp() + interval '1 hour'
      WHERE season_id = '2025-26'`);
    await page.reload();
    await expect(page.getByText('Las predicciones todavía no están abiertas.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /más puntos fantasy/ })).toHaveCount(0);
  } finally {
    await client.end();
  }
});
