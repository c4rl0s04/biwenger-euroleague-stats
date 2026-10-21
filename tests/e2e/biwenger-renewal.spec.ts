import { expect, test } from 'playwright/test';

test('Settings keeps credential renewal available after linking and reports failed renewals', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires disposable authenticated fixture');
  test.skip(!['desktop-1440', 'iphone-13'].includes(info.project.name));
  // The shared fixture rejects the intentional 401 used by this negative-path test.
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.route('**/_vercel/insights/script.js*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );
  const phone = info.project.name === 'iphone-13';
  let requests = 0;
  await page.route('**/api/user/link-biwenger', async (route) => {
    requests++;
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      email: 'fixture@example.invalid',
      password: 'synthetic-password',
    });
    await route.fulfill(
      requests === 1
        ? { json: { biwengerLinked: true } }
        : { status: 401, json: { message: 'Credenciales de Biwenger incorrectas.' } }
    );
  });
  await page.goto('/login?callbackUrl=%2Fsettings');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  if (phone) await page.getByRole('link', { name: /Biwenger/ }).click();
  else await page.getByRole('button', { name: 'Biwenger', exact: true }).click();
  const email = page.getByLabel('Email de Biwenger');
  const password = page.getByLabel('Contraseña de Biwenger', { exact: true });
  await email.fill('fixture@example.invalid');
  await password.fill('synthetic-password');
  await page.getByRole('button', { name: /Vincular cuenta/i }).click();
  await expect(password).toHaveValue('');
  const renew = page.getByRole('button', { name: 'Renovar conexión' });
  await expect(renew).toBeVisible();
  await expect(renew).toBeDisabled();
  await password.fill('synthetic-password');
  await renew.click();
  await expect(
    page.getByText('Credenciales de Biwenger incorrectas.', { exact: true })
  ).toBeVisible();
  await expect(renew).toBeEnabled();
  expect(requests).toBe(2);
  expect(browserErrors).toEqual([]);
});
