import { expect, test } from './fixtures';

for (const theme of ['dark', 'light']) {
  test(`shared empty results and modal interactions preserve ${theme} shell behavior`, async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_USERNAME || !process.env.E2E_PASSWORD,
      'Requires disposable fixture login'
    );
    await page.addInitScript((preference) => {
      localStorage.setItem('theme', preference);
    }, theme);
    await page.route('**/api/search?*', (route) => {
      const query = new URL(route.request().url()).searchParams.get('q');
      if (query === 'many-results') {
        return route.fulfill({
          json: {
            success: true,
            data: {
              players: Array.from({ length: 5 }, (_, index) => ({
                id: `player-${index + 1}`,
                name: `Player ${index + 1}`,
                team: 'Test Team',
              })),
              teams: Array.from({ length: 5 }, (_, index) => ({
                id: `team-${index + 1}`,
                name: `Team ${index + 1}`,
              })),
              users: Array.from({ length: 5 }, (_, index) => ({
                id: `user-${index + 1}`,
                name: `Manager ${index + 1}`,
              })),
            },
          },
        });
      }
      return route.fulfill({
        json: { success: true, data: { players: [], teams: [], users: [] } },
      });
    });
    await page.goto('/login?callbackUrl=%2Fdashboard');
    await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
    await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    const phone =
      (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';

    if (phone) {
      const trigger = page.getByRole('button', { name: 'Abrir búsqueda' });
      await trigger.click();
      const sheet = page.getByRole('dialog', { name: 'Buscar', exact: true });
      const close = sheet.getByRole('button', { name: 'Cerrar hoja', exact: true });
      const searchInput = sheet.getByRole('textbox', {
        name: 'Buscar jugadores, equipos y mánagers',
      });
      await expect(searchInput).toBeFocused();
      await expect(sheet.getByRole('button', { name: 'Cerrar búsqueda' })).toHaveCount(0);
      const visualViewport = await page.evaluate(() => ({
        top: window.visualViewport?.offsetTop ?? 0,
        height: window.visualViewport?.height ?? window.innerHeight,
      }));
      const searchLayer = sheet.locator('..');
      const layerMetrics = await searchLayer.evaluate((element) => ({
        top: Number.parseFloat((element as HTMLElement).style.top || '0'),
        height: Number.parseFloat((element as HTMLElement).style.height || '0'),
      }));
      expect(Math.abs(layerMetrics.top - visualViewport.top)).toBeLessThan(1);
      expect(Math.abs(layerMetrics.height - visualViewport.height)).toBeLessThan(1);
      const inputBox = await searchInput.boundingBox();
      expect(inputBox).not.toBeNull();
      expect(inputBox!.y).toBeGreaterThanOrEqual(visualViewport.top);
      expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(
        visualViewport.top + visualViewport.height + 1
      );
      await expect(sheet).toHaveAttribute('aria-describedby', /.+/);
      expect(
        await sheet.evaluate((element) => element.parentElement?.parentElement === document.body)
      ).toBe(true);
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Shift+Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(searchInput).toBeFocused();

      // A programmatic focus escape is contained, not only Tab at the boundaries.
      await trigger.evaluate((element) => element.focus());
      await expect(close).toBeFocused();

      await searchInput.fill('many-results');
      const resultViewport = sheet.locator('[data-search-results="sheet"]');
      await expect(resultViewport).toBeVisible();
      await expect(resultViewport.locator('[data-search-result]')).toHaveCount(15);
      const resultMetrics = await resultViewport.evaluate((element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        overflowY: getComputedStyle(element).overflowY,
        position: getComputedStyle(element).position,
      }));
      expect(resultMetrics.clientHeight).toBeGreaterThan(88);
      expect(resultMetrics.scrollHeight).toBeGreaterThan(resultMetrics.clientHeight);
      expect(resultMetrics.overflowY).toBe('auto');
      expect(resultMetrics.position).toBe('static');
      await resultViewport.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      expect(await resultViewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

      await searchInput.fill('zz-no-match');
      await expect(
        sheet.getByText('No se encontraron resultados para “zz-no-match”')
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

      await trigger.click();
      await page
        .getByRole('button', { name: 'Cerrar', exact: true })
        .click({ position: { x: 5, y: 5 } });
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();

      const profileTrigger = page.getByRole('button', { name: 'Abrir perfil' });
      await profileTrigger.click();
      const profile = page.getByRole('dialog', { name: 'Cuenta', exact: true });
      await expect(profile.getByRole('button', { name: 'Cerrar hoja', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(profile).toBeHidden();
      await expect(profileTrigger).toBeFocused();

      const more = page.getByRole('button', { name: 'Más', exact: true });
      await more.click();
      const menu = page.getByRole('dialog', { name: 'Más secciones' });
      const menuClose = menu.getByRole('button', { name: 'Cerrar menú Más' });
      await expect(menuClose).toBeFocused();

      const seasonTrigger = menu.getByRole('button', { name: 'Abrir selector de temporada' });
      if (await seasonTrigger.count()) {
        await seasonTrigger.click();
        const seasonMenu = menu.getByRole('menu');
        const seasonMenuBox = await seasonMenu.boundingBox();
        const viewport = page.viewportSize();
        expect(seasonMenuBox).not.toBeNull();
        expect(viewport).not.toBeNull();
        expect(seasonMenuBox!.x).toBeGreaterThanOrEqual(0);
        expect(seasonMenuBox!.x + seasonMenuBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
        await menu.getByRole('button', { name: 'Cerrar selector de temporada' }).click();
      }

      // Hidden/disabled descendants must not become the Shift+Tab boundary.
      await menu.evaluate((element) => {
        for (const state of ['hidden', 'disabled']) {
          const button = document.createElement('button');
          button.textContent = 'Unavailable action';
          button.setAttribute(state, '');
          element.appendChild(button);
        }
      });
      await page.keyboard.press('Shift+Tab');
      await expect(menu.getByRole('link', { name: 'Instalar', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(menuClose).toBeFocused();
      // The global command palette can open above a sheet; Escape closes only the top modal.
      await page.keyboard.press('Control+k');
      const palette = page.getByRole('dialog', { name: 'Buscar en la aplicación' });
      await expect(palette.getByRole('combobox')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(palette).toBeHidden();
      await expect(menu).toBeVisible();
      await expect(menuClose).toBeFocused();
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(more).toBeFocused();
    } else {
      // Tablet uses the header's expandable search instead of the inline desktop field.
      const searchToggle = page.getByRole('button', { name: 'Abrir búsqueda', exact: true });
      if (await searchToggle.isVisible()) {
        await searchToggle.click();
      }
      await page
        .getByRole('textbox', { name: 'Buscar jugadores, equipos y mánagers' })
        .fill('zz-no-match');
      await expect(page.getByText('No se encontraron resultados para “zz-no-match”')).toBeVisible();
      await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
      await page.getByRole('textbox', { name: 'Buscar jugadores, equipos y mánagers' }).focus();
      await page.keyboard.press('Control+k');
      await page.getByPlaceholder('Buscar página, jugador, equipo...').fill('zz-no-match');
      await expect(page.getByText('No se encontraron resultados.', { exact: true })).toBeVisible();
    }
    if (!phone) {
      const palette = page.getByRole('dialog', { name: 'Buscar en la aplicación' });
      const input = palette.getByRole('combobox');
      await expect(input).toBeFocused();
      await expect(input).toHaveCSS('outline-style', 'none');
      await expect(input.locator('..')).toHaveCSS('box-shadow', /inset/);
      await page.keyboard.press('Tab');
      await expect(input).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(input).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(palette).toBeHidden();
      await expect(
        page.getByRole('textbox', { name: 'Buscar jugadores, equipos y mánagers' })
      ).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  });
}
