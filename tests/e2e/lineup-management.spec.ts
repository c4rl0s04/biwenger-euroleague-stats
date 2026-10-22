import { test, expect } from 'playwright/test';
import { lineupFingerprint } from '../../src/features/lineup/logic/draft';

test('Lineup recovers stale ownership without losing the draft, clears slots, changes formation and preserves an uncertain save', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE);
  test.skip(!['desktop-1440', 'iphone-13'].includes(info.project.name));
  const phone = info.project.name === 'iphone-13';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/_vercel/insights/script.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  const players = [
    'Base',
    'Base',
    'Alero',
    'Alero',
    'Pivot',
    'Base',
    'Base',
    'Alero',
    'Pivot',
    'Alero',
    'Alero',
  ].map((position, i) => ({
    id: 99101 + i,
    name: `Live Player ${i + 1}`,
    position,
    price: 100,
    points: 100,
    average: 10,
    price_increment: 0,
    img: '/icons/icon-192.png',
    recent_scores: '',
    detailsAvailable: true,
  }));
  let current = {
    type: '2-2-1',
    playersID: players.slice(0, 10).map((p) => String(p.id)) as (string | null)[],
    reservesID: ['99111'] as (string | null)[],
    captain: '99101' as string | null,
  };
  let owned = [...players];
  let reads = 0;
  let writes = 0;
  await page.route('**/api/player/squad?*', () => {
    throw new Error('Lineup must not read stale database ownership');
  });
  await page.route('**/api/users/lineup/workspace', (route) => {
    reads++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          players: owned,
          provider: {
            lineup: current,
            players: owned.map((p) => ({ id: p.id })),
            offers: [],
            market: [],
          },
          baseline: lineupFingerprint(current),
          checkedAt: new Date().toISOString(),
        },
      },
    });
  });
  await page.route('**/api/users/lineup', async (route) => {
    expect(route.request().method()).toBe('POST');
    writes++;
    const body = route.request().postDataJSON();
    expect(typeof body.baseline).toBe('string');
    if (writes === 1) {
      owned = players.filter((p) => p.id !== 99103);
      current = {
        ...current,
        playersID: current.playersID.map((id) => (id === '99103' ? null : id)),
      };
      return route.fulfill({
        status: 409,
        json: {
          success: false,
          error: 'Tu plantilla ha cambiado en Biwenger. Revisa los cambios.',
          code: 'LINEUP_ROSTER_CHANGED',
          details: { invalidPlayerIds: ['99103'], affectedSlotIndexes: [2] },
        },
      });
    }
    if (writes === 2) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      current = body.lineup;
      return route.fulfill({ json: { success: true, data: { status: 'completed' } } });
    }
    // The server may have applied a write even when its response was lost.
    current = body.lineup;
    return route.fulfill({
      status: 503,
      json: {
        success: false,
        error:
          'No se pudo confirmar el guardado. Comprueba la alineación antes de volver a guardar.',
        code: 'LINEUP_SAVE_UNCONFIRMED',
      },
    });
  });
  await page.goto('/login?callbackUrl=%2Flineup');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/lineup$/);
  await page.clock.install();
  const save = page.getByRole('button', { name: phone ? 'Guardar alineación' : 'Guardar cambios' });
  const court = page.locator('[aria-label="Quinteto titular"]');
  const player = (name: string) =>
    court.getByRole('button', { name: new RegExp(`${name}(?![0-9])`) });
  // Select a newly owned reserve from a different position. No sync is required.
  await player('Live Player 2').click();
  const forward = page.getByRole('dialog').getByRole('button', { name: /Live Player 11/ });
  await expect(forward).toContainText('1-3-1');
  await forward.click();
  await expect(court.getByText('Live Player 11', { exact: true })).toBeVisible();
  await save.dblclick();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toContainText(
    'No se pudo guardar'
  );
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Revisar plantilla actualizada' })).toBeVisible();
  await expect(court.getByText('Live Player 11', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conservar mis cambios' }).click();
  await expect(court.getByText('Live Player 3', { exact: true })).toHaveCount(0);
  await expect(court.getByText('Live Player 11', { exact: true })).toBeVisible();
  const courtPosition = () =>
    court.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.x + window.scrollX,
        y: box.y + window.scrollY,
        width: box.width,
        height: box.height,
      };
    });
  const courtBeforeSave = await courtPosition();
  await save.click();
  await player('Live Player 1').evaluate((element) =>
    (element as HTMLElement).focus({ preventScroll: true })
  );
  await expect(page.getByText('Guardado correctamente', { exact: true })).toBeVisible();
  await expect(player('Live Player 1')).toBeFocused();
  expect(await courtPosition()).toEqual(courtBeforeSave);
  const toastBox = await page
    .getByRole('status')
    .filter({ hasText: 'Guardado correctamente' })
    .locator('..')
    .boundingBox();
  expect(toastBox).not.toBeNull();
  expect(toastBox!.x).toBeGreaterThanOrEqual(0);
  expect(toastBox!.x + toastBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (phone) {
    const actions = await page.locator('.mobile-sticky-action-bar').boundingBox();
    expect(toastBox!.y + toastBox!.height).toBeLessThan(actions!.y);
    expect(actions!.y - (toastBox!.y + toastBox!.height)).toBeLessThan(40);
  } else {
    const controls = await save.locator('..').boundingBox();
    expect(toastBox!.y + toastBox!.height).toBeLessThan(controls!.y);
    expect(
      Math.abs(toastBox!.x + toastBox!.width / 2 - (controls!.x + controls!.width / 2))
    ).toBeLessThan(2);
  }
  await page.mouse.move(0, 0);
  await page.clock.fastForward(2200);
  await expect(page.getByText('Guardado correctamente', { exact: true })).toBeVisible();
  await page.clock.fastForward(2000);
  await expect(page.getByText('Guardado correctamente', { exact: true })).toHaveCount(0);
  // Failed saves disappear, while their required recovery action remains accessible.
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toHaveText(
    'No se pudo guardar'
  );
  await page.clock.fastForward(4200);
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toBeVisible();
  await page.clock.fastForward(2000);
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toHaveCount(0);
  await expect(page.getByText('Comprueba tu alineación', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  // Clear the captain, preserving every other selection.
  await player('Live Player 1').click();
  await page.getByRole('button', { name: 'Dejar posición vacía', exact: true }).click();
  await expect(court.getByText('Base vacío', { exact: true })).toBeVisible();
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toContainText(
    'No se pudo guardar'
  );
  await expect(save).toBeDisabled();
  expect(writes).toBe(4);
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  await expect(save).toBeEnabled();
  await expect(page.getByText('Plantilla actualizada', { exact: true })).toBeVisible();
  await page.clock.fastForward(4200);
  await expect(page.getByText('Plantilla actualizada', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  await expect(page.getByText('Plantilla actualizada', { exact: true })).toBeVisible();
  const refreshToast = page.getByRole('status').filter({ hasText: 'Plantilla actualizada' });
  const closeToast = page.getByRole('button', { name: 'Cerrar aviso' });
  if (!phone) {
    await refreshToast.hover();
    await page.clock.fastForward(5000);
    await expect(refreshToast).toBeVisible();
  }
  await closeToast.focus();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(5000);
  await expect(refreshToast).toBeVisible();
  await save.focus();
  await page.clock.fastForward(4200);
  await expect(refreshToast).toHaveCount(0);
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  await expect(refreshToast).toBeVisible();
  await page.screenshot({ path: info.outputPath('toast-near-save.png') });
  await closeToast.click();
  await expect(refreshToast).toHaveCount(0);
  expect(reads).toBe(6);
  expect(writes).toBe(4);
  expect(current.captain).toBeNull();
  expect(errors).toEqual([]);
});

test('Lineup shows reconnect errors and lets the user load an external lineup explicitly', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE);
  test.skip(!['desktop-1440', 'iphone-13'].includes(info.project.name));
  const phone = info.project.name === 'iphone-13';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/_vercel/insights/script.js*', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  const players = ['Base', 'Base', 'Alero', 'Alero', 'Pivot', 'Alero'].map((position, i) => ({
    id: i + 1,
    name: `External Player ${i + 1}`,
    position,
    img: '/icons/icon-192.png',
    price: 100,
    points: 10,
    average: 10,
    price_increment: 0,
  }));
  let reads = 0;
  let writes = 0;
  let current = {
    type: '2-2-1',
    playersID: [1, 2, 3, 4, 5, null, null, null, null, null] as (number | null)[],
    reservesID: [6],
  };
  await page.route('**/api/users/lineup/workspace', (route) => {
    reads++;
    if (reads === 1)
      return route.fulfill({
        status: 409,
        json: {
          success: false,
          error: 'Renueva tu conexión con Biwenger para continuar.',
          code: 'BIWENGER_RECONNECT_REQUIRED',
        },
      });
    return route.fulfill({
      json: {
        success: true,
        data: {
          players,
          provider: { lineup: current, players, offers: [], market: [] },
          baseline: lineupFingerprint(current),
          checkedAt: new Date().toISOString(),
        },
      },
    });
  });
  await page.route('**/api/users/lineup', (route) => {
    writes++;
    expect(route.request().method()).toBe('POST');
    current = {
      ...current,
      playersID: [1, 2, 6, 4, 5, null, null, null, null, null],
      reservesID: [3],
    };
    return route.fulfill({
      status: 409,
      json: {
        success: false,
        error: 'Tu alineación ha cambiado en Biwenger.',
        code: 'LINEUP_CHANGED_ELSEWHERE',
      },
    });
  });
  await page.goto('/login?callbackUrl=%2Flineup');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/lineup$/);
  const save = page.getByRole('button', { name: phone ? 'Guardar alineación' : 'Guardar cambios' });
  await expect(page.getByRole('link', { name: 'Renovar conexión con Biwenger' })).toHaveAttribute(
    'href',
    '/settings/biwenger'
  );
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  await expect(save).toBeEnabled();
  const court = page.locator('[aria-label="Quinteto titular"]');
  await court.getByRole('button', { name: /External Player 4/ }).click();
  await page.getByRole('button', { name: 'Dejar posición vacía', exact: true }).click();
  await save.click();
  await expect(page.getByText('Actualiza tu plantilla', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Actualizar plantilla', exact: true }).click();
  await page.getByRole('button', { name: 'Cargar última alineación', exact: true }).click();
  await expect(court.getByText('External Player 6', { exact: true })).toBeVisible();
  await expect(court.getByText('External Player 4', { exact: true })).toBeVisible();
  await expect(court.getByText('External Player 3', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Cambios sin guardar', { exact: true })).toHaveCount(0);
  expect(reads).toBe(3);
  expect(writes).toBe(1);
  expect(errors).toEqual([]);
});
