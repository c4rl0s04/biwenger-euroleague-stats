import { expect, test } from './fixtures';

test('season predictions demo supports player and manager choices', async ({ page }, testInfo) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires disposable season data.');
  await page.goto('/login?callbackUrl=%2Fseason-predictions');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/season-predictions$/);

  const phone = (await page.locator('[data-presentation="phone"]').count()) > 0;
  await expect(
    page.getByRole('heading', { name: phone ? 'Predicciones' : 'Predicciones de temporada' })
  ).toBeVisible();
  await expect(page.getByText('Tus elecciones no se guardan')).toBeVisible();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const expectedGutter = viewportWidth >= 1024 ? 32 : viewportWidth >= 640 ? 24 : 16;
  const expectedTop = viewportWidth >= 1024 ? 64 : viewportWidth >= 640 ? 48 : 32;
  if (phone) {
    const mobileHeader = page.locator('.mobile-native-header');
    await expect(mobileHeader).toHaveCSS('position', 'sticky');
    await expect(page.getByRole('button', { name: 'Abrir búsqueda' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir perfil' })).toBeVisible();
    await expect(page.locator('.mobile-native-screen')).toHaveCSS(
      'padding-left',
      viewportWidth < 359 ? '12px' : '16px'
    );
  } else {
    const canvas = page.locator('[data-page-canvas]');
    await expect(canvas).toHaveCSS('padding-left', `${expectedGutter}px`);
    await expect(canvas).toHaveCSS('padding-right', `${expectedGutter}px`);
    await expect(canvas).toHaveCSS('padding-top', `${expectedTop}px`);
    const alignment = await page.evaluate(() => {
      const canvas = document.querySelector('[data-page-canvas]')!;
      const content = canvas.firstElementChild!;
      const heading = canvas.querySelector('h1')!;
      const section = canvas.querySelector('section')!;
      return {
        canvasLeft: canvas.getBoundingClientRect().left,
        contentLeft: content.getBoundingClientRect().left,
        contentWidth: content.getBoundingClientRect().width,
        headingLeft: heading.getBoundingClientRect().left,
        sectionLeft: section.getBoundingClientRect().left,
      };
    });
    expect(alignment.contentLeft - alignment.canvasLeft).toBeGreaterThanOrEqual(expectedGutter - 1);
    expect(alignment.contentWidth).toBeLessThanOrEqual(1280);
    expect(Math.abs(alignment.headingLeft - alignment.contentLeft)).toBeLessThan(1);
    expect(Math.abs(alignment.sectionLeft - alignment.contentLeft)).toBeLessThan(1);
  }
  await page.screenshot({
    path: testInfo.outputPath('season-predictions-dark.png'),
    fullPage: true,
  });
  const mobileMore = page.getByRole('button', { name: 'Más', exact: true });
  if (await mobileMore.isVisible()) {
    await mobileMore.click();
    await expect(page.getByRole('link', { name: 'Predicciones de temporada' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar menú Más' }).click();
  } else {
    await expect(page.locator('a[href="/season-predictions"]:visible').first()).toBeVisible();
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);

  await page.getByRole('button', { name: /Seleccionar jugador: Elige un jugador/ }).click();
  await expect(page.getByRole('dialog', { name: 'Seleccionar jugador' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('season-predictions-picker.png') });
  const playerSearch = page.getByRole('combobox', { name: 'Buscar seleccionar jugador' });
  await expect(playerSearch).toBeFocused();
  await expect(page.getByRole('option').first()).toContainText('Base');
  await playerSearch.fill('Fixture');
  await expect(page.getByRole('option').first()).toBeVisible();
  await playerSearch.press('ArrowDown');
  await playerSearch.press('Enter');
  await expect(page.getByText('Tu elección:').first()).toBeVisible();
  await page.getByRole('button', { name: /Borrar elección:/ }).click();
  await expect(
    page.getByRole('button', { name: /Seleccionar jugador: Elige un jugador/ })
  ).toBeVisible();

  await page.getByRole('button', { name: /Seleccionar mánager: Elige un mánager/ }).click();
  await page.getByRole('combobox', { name: 'Buscar seleccionar mánager' }).fill('zzzz-no-result');
  await expect(page.getByText('No hay mánagers que coincidan')).toBeVisible();
  await page.getByRole('combobox', { name: 'Buscar seleccionar mánager' }).fill('');
  await page.getByRole('option').first().click();
  await expect(page.getByText('Tu elección:').first()).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('button', { name: /Seleccionar mánager: Elige un mánager/ })
  ).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'light' }));
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(
    page.getByRole('heading', { name: phone ? 'Predicciones' : 'Predicciones de temporada' })
  ).toBeVisible();
  if (phone) {
    const titleColor = await page.locator('.mobile-native-title').evaluate((title) => {
      const reference = document.createElement('span');
      reference.style.color = 'hsl(var(--content-primary))';
      title.parentElement!.append(reference);
      const colors = {
        actual: getComputedStyle(title).color,
        expected: getComputedStyle(reference).color,
      };
      reference.remove();
      return colors;
    });
    expect(titleColor.actual).toBe(titleColor.expected);
  }
  await page.screenshot({
    path: testInfo.outputPath('season-predictions-light.png'),
    fullPage: true,
  });

  if (testInfo.project.name.startsWith('desktop')) {
    await page.goto('/schedule');
    await page.locator('a[href="/season-predictions"]:visible').first().click();
    await expect(page).toHaveURL(/\/season-predictions$/);
    await expect(page.locator('[data-page-canvas]')).toHaveCSS(
      'padding-left',
      `${expectedGutter}px`
    );
    await page.setViewportSize({ width: 1920, height: 900 });
    const wideLayout = await page.evaluate(() => {
      const canvas = document.querySelector('[data-page-canvas]')!;
      const content = canvas.firstElementChild!;
      return {
        canvasLeft: canvas.getBoundingClientRect().left,
        contentLeft: content.getBoundingClientRect().left,
        contentWidth: content.getBoundingClientRect().width,
      };
    });
    expect(wideLayout.contentWidth).toBe(1280);
    expect(wideLayout.contentLeft - wideLayout.canvasLeft).toBeGreaterThan(32);
  }
});
