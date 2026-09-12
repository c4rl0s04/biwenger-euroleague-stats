import { test, expect } from './fixtures';

test('Standings overview and phone sections retain their read experience', async ({ page }) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the disposable synthetic league.');
  await page.goto('/login?callbackUrl=%2Fstandings');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/standings$/);
  await expect(page.getByRole('heading', { name: 'Clasificación', exact: true })).toBeVisible();
  await expect(page.getByText('Fixture Manager', { exact: true }).first()).toBeVisible();
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    const sections = [
      ['progression', 'Evolución'],
      ['rounds', 'Jornadas'],
      ['draft', 'Draft inicial'],
      ['form', 'Estado de forma'],
      ['performance', 'Rendimiento'],
      ['alternatives', 'Clasificaciones'],
      ['curiosities', 'Curiosidades'],
      ['captains', 'Capitanes'],
    ];
    for (const [section, title] of sections) {
      await page.locator(`a[href="/standings/${section}"]`).click();
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByText('Datos destacados', { exact: true })).toBeVisible();
      expect(await page.locator('.mobile-record-index').count()).toBeLessThanOrEqual(20);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
      ).toBe(true);
      if (section === 'captains') {
        await expect(page.locator('a[href="/user/99001"]').first()).toBeVisible();
      }
      await page.getByRole('link', { name: 'Volver a Clasificación' }).click();
      await expect(page.getByRole('heading', { name: 'Clasificación', exact: true })).toBeVisible();
    }
  } else {
    await page.locator('#general-standings').scrollIntoViewIfNeeded();
    await expect(
      page
        .locator('#general-standings')
        .getByText('Fixture Rival', { exact: true })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
  }
});
