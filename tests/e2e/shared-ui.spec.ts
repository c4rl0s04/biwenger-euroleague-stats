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
    await page.route('**/api/search?*', (route) =>
      route.fulfill({
        json: { success: true, data: { players: [], teams: [], users: [] } },
      })
    );
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
      await expect(close).toBeFocused();
      await expect(sheet).toHaveAttribute('aria-describedby', /.+/);
      expect(
        await sheet.evaluate((element) => element.parentElement?.parentElement === document.body)
      ).toBe(true);
      await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Shift+Tab');
      await expect(
        sheet.getByRole('button', { name: 'Cerrar búsqueda', exact: true })
      ).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();

      // A programmatic focus escape is contained, not only Tab at the boundaries.
      await trigger.evaluate((element) => element.focus());
      await expect(close).toBeFocused();
      await sheet
        .getByRole('textbox', { name: 'Buscar jugadores, equipos y mánagers' })
        .fill('zz-no-match');
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
