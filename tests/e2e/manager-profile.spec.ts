import type { Locator, Page, TestInfo } from 'playwright/test';
import { test, expect } from './fixtures';

// Baselines are captured from the unchanged Manager Profile at 1a2c0c68
// (application code identical to production 084bd9fe), using this same seed.
const managerPath = '/user/99001';
const sections = [
  { slug: 'season', title: 'Temporada', desktop: '#season-performance' },
  { slug: 'squad', title: 'Plantilla', desktop: '#squad-analysis' },
  { slug: 'evolution', title: 'Evolución', desktop: '#points-evolution' },
  { slug: 'contributors', title: 'Contribuidores', desktop: '#top-contributors' },
  { slug: 'competitions', title: 'Competiciones', desktop: '#tournaments' },
] as const;

async function login(page: Page, callbackPath = managerPath) {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackPath}$`));
}

async function capture(page: Page, testInfo: TestInfo, name: string, target?: Locator) {
  // Linux runs all semantic checks; Profile Linux visual baselines are still pending.
  // Never initialize those baselines from the migrated implementation.
  if (
    process.platform !== 'darwin' ||
    !['iphone-13', 'desktop-1440'].includes(testInfo.project.name)
  )
    return;
  await page.evaluate(() => document.fonts.ready);
  const options = {
    animations: 'disabled' as const,
    timeout: 60000,
    stylePath: 'tests/e2e/screenshot.css',
  };
  if (target) await expect(target).toHaveScreenshot(`${name}.png`, options);
  else await expect(page).toHaveScreenshot(`${name}.png`, { ...options, fullPage: true });
}

test('Manager Profile preserves desktop and phone sections and interactions', async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE,
    'Requires the synthetic league from test:e2e:local.'
  );
  await login(page);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    await expect(
      page.getByRole('heading', { name: 'Fixture Manager', exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText('2 jornadas · 1 victorias', { exact: true })).toBeVisible();
    for (const section of sections)
      await expect(page.locator(`a[href="${managerPath}/${section.slug}"]`)).toBeVisible();
  } else {
    await expect(
      page.getByRole('heading', { name: 'Perfil de Fixture Manager', exact: true })
    ).toBeVisible();
    await expect(page.getByText('Dominio de Liga (H2H Virtual)', { exact: true })).toBeVisible();
    await expect(
      page.locator('#squad-analysis').getByText('Fixture Guard', { exact: true })
    ).toBeVisible();
    await expect(
      page.locator('#top-contributors').getByText('Fixture Contributor 01', { exact: true })
    ).toBeVisible();
    await expect(page.locator('a[href="/tournaments/99301"]').first()).toBeVisible();
    await expect(page.locator('a[href="/tournaments/99302"]').first()).toBeVisible();
  }
  await capture(page, testInfo, 'manager-profile');

  for (const section of sections) {
    if (phone) await page.locator(`a[href="${managerPath}/${section.slug}"]`).click();
    else {
      // Let legitimate shell prefetches finish before replacing the document in WebKit.
      await page.waitForLoadState('networkidle');
      await page.goto(`${managerPath}/${section.slug}`);
    }
    if (phone) {
      await expect(page).toHaveURL(new RegExp(`${managerPath}/${section.slug}$`));
      await expect(
        page.getByRole('heading', { name: section.title, exact: true }).first()
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Detalle', exact: true })).toBeVisible();
      if (section.slug === 'season') {
        // Legacy generic normalization selects the first array (empty last_transfers).
        await expect(
          page.getByText('No hay datos disponibles para esta vista.', { exact: true })
        ).toBeVisible();
      } else if (section.slug === 'squad') {
        // Legacy normalization selects top_rising rather than the full players array.
        await expect(
          page.locator('a[href="/player/99101"]').getByText('Fixture Guard', { exact: true })
        ).toBeVisible();
      } else if (section.slug === 'evolution') {
        await expect(page.getByText('Jornada 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Jornada 2', { exact: true })).toBeVisible();
      } else if (section.slug === 'contributors') {
        await expect(
          page
            .locator('a[href="/player/99201"]')
            .getByText('Fixture Contributor 01', { exact: true })
        ).toBeVisible();
        await expect(page.getByText('Fixture Contributor 12', { exact: true })).toBeVisible();
      } else {
        // tournament_name is deliberately not a generic TITLE_KEY in the old screen.
        await expect(page.getByText('Registro 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Registro 2', { exact: true })).toBeVisible();
      }
      await capture(page, testInfo, `manager-${section.slug}`);
      await page.locator(`a[href="${managerPath}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${managerPath}$`));
    } else {
      // Preserve existing desktop section redirects, including their historical hash names.
      await expect(page).toHaveURL(new RegExp(`${managerPath}#${section.slug}$`));
      const target = page.locator(section.desktop);
      await expect(target).toBeVisible();
      await capture(page, testInfo, `manager-${section.slug}`, target);
    }
  }

  if (!phone) {
    const expand = page.getByRole('button', { name: 'Ver otros 2 jugadores' });
    await expand.click();
    await expect(
      page.locator('#top-contributors').getByText('Fixture Contributor 12', { exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ocultar historial completo' }).click();
    await expect(
      page.locator('#top-contributors').getByText('Fixture Contributor 12', { exact: true })
    ).toHaveCount(0);
    await expect(page.locator('#top-contributors a[href="/player/99201"]')).toHaveCount(1);
  }
  await page.waitForLoadState('networkidle');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);
});

test('missing Manager Profile preserves the existing empty presentation', async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE,
    'Requires the synthetic league from test:e2e:local.'
  );
  // Arrive directly: hard-navigation from the valid profile aborts its link prefetches in WebKit.
  await login(page, '/user/1');
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) await expect(page.getByText('Mánager no encontrado.', { exact: true })).toBeVisible();
  else {
    await expect(
      page.getByRole('heading', { name: 'Manager no encontrado', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver a la clasificación' })).toHaveAttribute(
      'href',
      '/standings'
    );
  }
  await capture(page, testInfo, 'manager-not-found');
});
