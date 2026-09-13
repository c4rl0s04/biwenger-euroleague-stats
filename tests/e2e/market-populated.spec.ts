import { test, expect } from './fixtures';
import type { Locator, Page } from 'playwright/test';

test('populated Market preserves listings, history and ranking interaction', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(process.env.E2E_FIXTURE_SCENARIO !== 'market', 'Run with --fixture=market.');
  await page.goto('/login?callbackUrl=%2Fmarket');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/market$/);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  await expect(page.getByRole('heading', { name: 'Mercado', exact: true }).first()).toBeVisible();

  // These are real application reads against the dedicated synthetic PostgreSQL fixture.
  const response = await page.request.get('/api/market/stats');
  expect(response.status()).toBe(200);
  const stats = (await response.json()).data;
  expect(stats.currentMarketListings).toHaveLength(3);
  // The existing ranking includes purchases from Mercado as well as manager-to-manager sales.
  expect(stats.recordTransfer).toHaveLength(5);
  expect(stats.bestFlip.length).toBeGreaterThan(0);
  expect(stats.worstFlip.length).toBeGreaterThan(0);
  expect(stats.biddingDuels.users).toHaveLength(2);

  const capture = async (name: string, target: Locator | Page = page) => {
    // Originals must be captured in the retained pre-screen-migration checkout, never
    // initialized from the migrated output. Linux references remain a C14 requirement.
    if (process.platform !== 'darwin' || !['iphone-13', 'desktop-1440'].includes(info.project.name))
      return;
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await expect(target).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
      timeout: 60000,
      stylePath: 'tests/e2e/screenshot.css',
    });
  };

  if (phone) {
    for (const id of [99101, 99311, 99313]) {
      await expect(page.locator(`a.mobile-list-row[href="/player/${id}"]`).first()).toBeVisible();
    }
    await capture('market-populated-phone-overview');
    // Offscreen rows use content-visibility:auto. Capture them in the actual viewport,
    // not as blank offscreen placeholders in a full-document image.
    const activity = page
      .locator('.mobile-section-heading')
      .filter({ hasText: 'Actividad reciente' })
      .locator('xpath=following-sibling::div[1]');
    // Center the block clear of the fixed phone navigation; bottom-edge scrolling would
    // leave its fourth row covered by the dock in the reference image.
    await activity.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' })
    );
    await expect(activity.getByText('Fixture Market Wing', { exact: true })).toHaveCount(2);
    await capture('market-populated-phone-activity', activity);
    for (const [section, title] of [
      ['transfers', 'Fichajes'],
      ['investments', 'Inversiones'],
    ]) {
      await page.locator(`a.mobile-section-link[href="/market/${section}"]`).click();
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.locator('.mobile-record-index').first()).toBeVisible();
      await expect(page.getByText('No hay datos disponibles para esta vista.')).toHaveCount(0);
      await capture(`market-populated-phone-${section}`);
      await page.getByRole('link', { name: 'Volver a Mercado', exact: true }).click();
      await expect(page).toHaveURL(/\/market$/);
    }
  } else {
    const listings = page.locator('#jugadores-en-el-mercado');
    await expect(
      listings.getByRole('heading', { name: 'Fixture Market Wing', exact: true })
    ).toBeVisible();
    await capture('market-populated-listings', listings);
    await listings.getByPlaceholder('Nombre...').fill('Market Free');
    await expect(
      listings.getByRole('heading', { name: 'Fixture Market Free', exact: true })
    ).toBeVisible();
    await expect(
      listings.getByRole('heading', { name: 'Fixture Market Wing', exact: true })
    ).toHaveCount(0);
    await listings.getByPlaceholder('Nombre...').fill('');
    await expect(
      listings.getByRole('heading', { name: 'Fixture Market Wing', exact: true })
    ).toBeVisible();

    // The label shares its span with tooltip content, so its full text is not an exact match.
    await page.getByText('Récord Histórico').first().click({ timeout: 15000 });
    const drawer = page.locator('div[class~="z-[201]"]');
    await expect(
      drawer.getByRole('heading', { name: 'Récord de Traspasos', exact: true })
    ).toBeVisible();
    await expect(drawer.getByText('Fixture Market Wing', { exact: true })).toHaveCount(2);
    await expect(drawer.getByText('Fixture Market Wing', { exact: true }).first()).toBeVisible();
    await capture('market-populated-transfer-ranking', drawer);
    const transferRows = await drawer.locator('h4').count();
    await drawer.getByTitle('Fixture Rival', { exact: true }).click();
    await expect.poll(() => drawer.locator('h4').count()).toBeLessThan(transferRows);
    expect(await drawer.locator('h4').count()).toBeGreaterThan(0);
    await drawer.getByTitle('Todos los Managers', { exact: true }).click();
    await expect(drawer.locator('h4')).toHaveCount(transferRows);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

    for (const [trigger, title, category, count] of [
      ['El Jeque', 'Los Grandes Gastadores', 'user', stats.bigSpender.length],
      ['El Pelotazo', 'El Pelotazo', 'temporal', stats.bestFlip.length],
      ['El más fichado', 'El Más Deseado', 'player', stats.topPlayer.length],
    ] as const) {
      expect(count).toBeGreaterThan(0);
      // Header text also occurs in a nested hidden tooltip; target the card header itself.
      await page
        .locator('.stat-card > div > div > span')
        .filter({ hasText: trigger })
        .first()
        .click({ timeout: 15000 });
      await expect(drawer.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(drawer.locator('h4')).toHaveCount(count);
      // Framer's JavaScript entry motion must finish before taking an original reference.
      await page.mouse.move(0, 0);
      await expect(drawer).toHaveCSS('transform', 'none');
      for (const row of await drawer.locator('.custom-scrollbar > div').all()) {
        await expect(row).toHaveCSS('opacity', '1');
        await expect(row).toHaveCSS('transform', 'none');
      }
      await capture(`market-populated-${category}-ranking`, drawer);
      await page.keyboard.press('Escape');
      await expect(drawer).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    }

    const duelCell = page.getByRole('button', {
      name: /^Fixture Manager contra Fixture Rival,/,
    });
    await duelCell.click();
    await expect(duelCell).toHaveAttribute('aria-pressed', 'true');
    const detail = page
      .getByRole('button', { name: 'Cerrar detalle', exact: true })
      .locator('xpath=ancestor::div[contains(@class, "animate-in")][1]');
    await expect(detail.locator('a[href^="/players/"]')).toHaveCount(4);
    await expect(detail.locator('a[href="/players/99101"]')).toBeVisible();
    // Move the resting pointer before scrolling new content underneath it.
    await page.mouse.move(0, 0);
    await detail.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' })
    );
    await capture('market-populated-duel-details', detail);
    await page.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
    await expect(duelCell).toHaveAttribute('aria-pressed', 'false');
    await duelCell.focus();
    await duelCell.press('Enter');
    await expect(duelCell).toHaveAttribute('aria-pressed', 'true');
    await duelCell.press('Space');
    await expect(duelCell).toHaveAttribute('aria-pressed', 'false');
    const reverseCell = page.getByRole('button', {
      name: /^Fixture Rival contra Fixture Manager,/,
    });
    await reverseCell.click();
    await expect(reverseCell).toHaveAttribute('aria-pressed', 'true');
    await expect(detail.locator('a[href^="/players/"]')).toHaveCount(4);
    await page.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
  }
});
