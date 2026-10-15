import pg from 'pg';
import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures';
import { waitForScreenshotPaint } from './screenshot-ready';
import { assertFixtureTarget } from '../../scripts/e2e/safety.mjs';

test('Auto-lineup completion stays in the viewport with an intercepted save', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  const connectionString = process.env.E2E_DATABASE_URL;
  assertFixtureTarget(connectionString, process.env);
  const client = new pg.Client({ connectionString });
  await client.connect();
  let finishRequest: (() => void) | undefined;
  let requestBody: unknown;
  let submissions = 0;
  try {
    // Existing synthetic contributors only; restore their original state below.
    await client.query(`UPDATE player_seasons SET owner_id='99001',team_id=9901,
      position=CASE player_id % 3 WHEN 0 THEN 'Base' WHEN 1 THEN 'Alero' ELSE 'Pivot' END
      WHERE season_id='2025-26' AND player_id BETWEEN 99201 AND 99209`);
    await page.route('https://cdn.biwenger.com/i/t/*.png', (route) =>
      route.fulfill({ contentType: 'image/png', body: readFileSync('public/icons/icon-192.png') })
    );
    await page.route('**/api/users/lineup', async (route) => {
      expect(route.request().method()).toBe('POST');
      requestBody = route.request().postDataJSON();
      submissions++;
      await new Promise<void>((resolve) => {
        finishRequest = resolve;
      });
      await route.fulfill({ json: { success: true } });
    });
    await page.goto('/login?callbackUrl=%2Fschedule');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/schedule$/);
    const phone =
      (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
    const sizes = phone
      ? [
          { width: 320, height: 568 },
          { width: 390, height: 844 },
          { width: 430, height: 932 },
        ]
      : [info.project.use.viewport!];
    for (const size of sizes) {
      await page.setViewportSize(size);
      for (const theme of ['dark', 'light']) {
        await page.evaluate(
          (value) => document.documentElement.setAttribute('data-theme', value),
          theme
        );
        const exclusions = page.locator('.schedule-lineup-exclusions');
        await exclusions.locator('summary').click();
        await expect(exclusions.getByRole('checkbox')).toHaveCount(10);
        await exclusions.getByRole('checkbox').first().check();
        await expect(exclusions.locator('summary')).toHaveText('Excluir jugadores (1)');
        await page.screenshot({
          path: info.outputPath(`exclusions-${size.width}-${theme}.png`),
          animations: 'disabled',
        });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true);
        await exclusions.getByRole('button', { name: 'Incluir todos' }).click();
        await exclusions.locator('summary').click();
        // Reproduce a containing block that would trap an inline fixed modal.
        await page.locator('main').evaluate((element) => {
          element.style.transform = 'translateZ(0)';
        });
        const button = page.getByRole('button', { name: /^(Auto-Alinear|Alineando|Procesando)/ });
        await button.click();
        await expect(button).toBeDisabled();
        await expect.poll(() => Boolean(finishRequest)).toBe(true);
        await page.evaluate(() =>
          window.scrollTo({
            top: Math.max(0, (document.documentElement.scrollHeight - innerHeight) / 2),
            behavior: 'instant',
          })
        );
        const scrollBefore = await page.evaluate(() => window.scrollY);
        finishRequest?.();
        finishRequest = undefined;
        const dialog = page.getByRole('dialog', { name: 'Alineación enviada' });
        await expect(dialog).toBeVisible();
        await waitForScreenshotPaint(page);
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
        expect(
          await page
            .locator('.schedule-lineup-overlay')
            .evaluate((element) => element.parentElement === document.body)
        ).toBe(true);
        const bounds = await dialog.boundingBox();
        expect(bounds!.y).toBeGreaterThanOrEqual(0);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height + 1);
        expect(Math.abs(bounds!.x + bounds!.width / 2 - size.width / 2)).toBeLessThan(2);
        expect(Math.abs(bounds!.y + bounds!.height / 2 - size.height / 2)).toBeLessThan(2);
        await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeInViewport();
        const list = dialog.locator('.schedule-lineup-player-list');
        await list.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        await expect(list.getByRole('button').last()).toBeInViewport();
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
        await list.evaluate((element) => {
          element.scrollTop = 0;
        });
        expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
          true
        );
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).focus();
        await page.keyboard.press('Tab');
        await expect(
          dialog.getByRole('button', { name: 'Cerrar alineación', exact: true })
        ).toBeFocused();
        await page.screenshot({
          path: info.outputPath(`lineup-dialog-${size.width}-${theme}.png`),
          animations: 'disabled',
        });
        if (theme === 'light')
          await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        else await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(button).toBeFocused();
        expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true);
      }
    }
    expect(submissions).toBe(sizes.length * 2);
    expect(requestBody).toMatchObject({
      lineup: {
        playersID: expect.arrayContaining([
          99101,
          ...Array.from({ length: 9 }, (_, index) => 99201 + index),
        ]),
        captain: 99101,
        reservesID: [],
      },
    });
    const exclusions = page.locator('.schedule-lineup-exclusions');
    await exclusions.locator('summary').click();
    const checkboxes = exclusions.getByRole('checkbox');
    for (const checkbox of await checkboxes.all()) await checkbox.check();
    const action = page.getByRole('button', { name: 'Auto-Alinear', exact: true });
    await expect(action).toBeDisabled();
    await expect(page.locator('.schedule-lineup-controls').getByRole('alert')).toContainText(
      'Incluye más jugadores'
    );
    expect(submissions).toBe(sizes.length * 2);
    await exclusions.getByRole('button', { name: 'Incluir todos' }).click();
    await expect(action).toBeEnabled();
    await exclusions.getByRole('checkbox', { name: /Fixture Guard/ }).check();
    await action.click();
    await expect(checkboxes.first()).toBeDisabled();
    await expect.poll(() => Boolean(finishRequest)).toBe(true);
    finishRequest?.();
    finishRequest = undefined;
    const dialog = page.getByRole('dialog', { name: 'Alineación enviada' });
    await expect(dialog).toBeVisible();
    const sent = requestBody as { lineup: { playersID: number[]; captain: number } };
    expect(sent.lineup.playersID).not.toContain(99101);
    expect(sent.lineup.playersID).toHaveLength(9);
    expect(sent.lineup.captain).not.toBe(99101);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(exclusions.getByRole('checkbox', { name: /Fixture Guard/ })).toBeChecked();
    await page.reload();
    await expect(exclusions.locator('summary')).toHaveText('Excluir jugadores (0)');
  } finally {
    finishRequest?.();
    await client.query(
      "UPDATE player_seasons SET owner_id=NULL,team_id=NULL,position='1' WHERE season_id='2025-26' AND player_id BETWEEN 99201 AND 99209"
    );
    await client.end();
  }
});
