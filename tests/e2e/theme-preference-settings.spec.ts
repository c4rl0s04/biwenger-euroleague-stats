import type { Page } from 'playwright';
import { expect, test } from './fixtures';

async function openAppearance(page: Page, phone: boolean) {
  if (phone) {
    await page.getByRole('link', { name: /Apariencia/ }).click();
    await expect(page).toHaveURL(/\/settings\/appearance$/);
  }
  await expect(page.getByRole('group', { name: 'Tema', exact: true })).toBeVisible();
}

test('Settings persists explicit themes and system, with independent snow and keyboard selection', async ({
  page,
}, testInfo) => {
  test.skip(
    !['desktop-1440', 'iphone-13'].includes(testInfo.project.name),
    'Representative desktop and phone flows'
  );
  expect(process.env.E2E_USERNAME, 'Disposable authenticated fixture is required').toBeTruthy();
  expect(process.env.E2E_PASSWORD).toBeTruthy();
  const phone = testInfo.project.name === 'iphone-13';
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/login?callbackUrl=%2Fsettings');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await openAppearance(page, phone);
  const radio = (name: string) => page.getByRole('radio', { name, exact: true });
  await expect(radio('Oscuro')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();

  if (phone) {
    await page.getByRole('switch', { name: 'Efecto de nieve' }).click();
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  }
  const snow = await page.evaluate(() => localStorage.getItem('showSnow'));
  for (const [label, preference] of [
    ['Claro', 'light'],
    ['Oscuro', 'dark'],
    ['Sistema', 'system'],
  ] as const) {
    await radio(label).check();
    await expect(radio(label)).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      preference === 'system' ? 'light' : preference
    );
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(preference);
    expect(await page.evaluate(() => localStorage.getItem('showSnow'))).toBe(snow);
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(radio(label)).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      preference === 'system' ? 'light' : preference
    );
    if (phone) await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      (await page.evaluate(() => innerWidth)) + 1
    );
    for (const option of await page
      .getByRole('group', { name: 'Tema', exact: true })
      .locator('label')
      .all()) {
      const box = await option.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    if (phone) {
      const foreground = await page
        .getByRole('group', { name: 'Tema', exact: true })
        .evaluate((element) => getComputedStyle(element).color);
      await expect(page.getByRole('heading', { name: 'Apariencia', exact: true })).toHaveCSS(
        'color',
        foreground
      );
    }
    await testInfo.attach(`${preference}-settings`, {
      body: await page.screenshot({
        path: testInfo.outputPath(`${preference}-settings.png`),
        fullPage: true,
      }),
      contentType: 'image/png',
    });
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(radio('Sistema')).toBeChecked();
  await expect(page.getByText('Según tu dispositivo, ahora se usa el tema oscuro.')).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(radio('Sistema')).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');

  await radio('Sistema').focus();
  await page.keyboard.press('ArrowRight');
  await expect(radio('Oscuro')).toBeChecked();
  await expect(radio('Oscuro')).toBeFocused();
  await expect(radio('Oscuro').locator('..')).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(radio('Claro')).toBeChecked();
  // Native WebKit radios stop at the group boundary instead of wrapping.
  await page.keyboard.press('ArrowLeft');
  await expect(radio('Oscuro')).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(radio('Sistema')).toBeChecked();

  if (phone) {
    await page.getByRole('switch', { name: 'Efecto de nieve' }).click();
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await expect(radio('Sistema')).toBeChecked();
    const foreground = await page
      .getByRole('group', { name: 'Tema', exact: true })
      .evaluate((element) => getComputedStyle(element).color);
    await page.getByRole('link', { name: /Volver/ }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toHaveCSS(
      'color',
      foreground
    );
  } else {
    await page
      .getByRole('link', { name: 'Dashboard', exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page
      .getByRole('link', { name: 'Ajustes', exact: true })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/settings$/);
  }
  await openAppearance(page, phone);
  await expect(radio('Sistema')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
  expect(await page.evaluate(() => localStorage.getItem('showSnow'))).toBe(phone ? 'false' : snow);
});
