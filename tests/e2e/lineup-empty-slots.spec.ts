import { test, expect } from './fixtures';

test('Lineup preserves an Alero gap, fills that exact slot and saves without moving the bench', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the synthetic authenticated league.');
  test.skip(!['desktop-1440', 'iphone-13'].includes(info.project.name));
  const positions = [
    'Base',
    'Base',
    'Alero',
    'Alero',
    'Pivot',
    'Alero',
    'Base',
    'Pivot',
    'Alero',
    'Base',
    'Alero',
  ];
  const players = positions.map((position, i) => ({
    id: 99101 + i,
    name: i === 10 ? 'Reserve Alero' : `Slot Player ${i + 1}`,
    position,
    team: 'Fixture Team',
    price: 1000000,
    price_increment: 0,
    points: 100,
    average: 10,
    recent_scores: '10,10',
    img: '/icons/icon-512.png',
  }));
  const ids = players.slice(0, 10).map((p, i) => (i === 3 ? null : p.id));
  const submitted: Array<{ playersID: (string | null)[]; reservesID: (string | null)[] }> = [];
  const provider = {
    lineup: { type: '2-2-1', playersID: ids, reservesID: [null, 99111, null], captain: 99101 },
    players: players.map((p) => ({ id: p.id })),
    market: [],
    offers: [{ id: 1, requestedPlayers: [99101], amount: 1200000, until: 4102444800 }],
  };
  await page.route('**/api/users/lineup/workspace', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          provider,
          players,
          baseline: 'fixture-baseline',
          checkedAt: new Date().toISOString(),
        },
      },
    })
  );
  await page.route('**/api/users/lineup', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(typeof route.request().postDataJSON().baseline).toBe('string');
    submitted.push(route.request().postDataJSON().lineup);
    await route.fulfill({ json: { success: true, data: { status: 'completed' } } });
  });
  await page.goto('/login?callbackUrl=%2Flineup');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/lineup$/);
  const court = page.locator('[aria-label="Quinteto titular"]');
  await expect(court.getByText('Alero vacío', { exact: true })).toBeVisible();
  await expect(court.getByText('Slot Player 6', { exact: true })).toHaveCount(0);
  if (info.project.name === 'desktop-1440') {
    const portraits = page.getByRole('img', { name: 'Slot Player 1', exact: true });
    await expect(portraits).toHaveCount(3);
    for (const portrait of await portraits.all()) {
      await expect(portrait).toHaveAttribute('src', /icon-512/);
    }
    await page.getByTitle('Vista de Tabla', { exact: true }).click();
    await expect(portraits).toHaveCount(3);
    for (const portrait of await portraits.all()) {
      await expect(portrait).toHaveAttribute('src', /icon-512/);
    }
  }
  const save = page.getByRole('button', {
    name: info.project.name === 'iphone-13' ? 'Guardar alineación' : 'Guardar cambios',
  });
  await save.click();
  await expect.poll(() => submitted.length).toBe(1);
  expect(submitted[0].playersID).toEqual(ids.map((id) => (id === null ? null : String(id))));
  expect(submitted[0].reservesID).toEqual([null, '99111', null]);
  const gap = court.getByRole('button', { name: /Alero vacío/ });
  if (info.project.name === 'desktop-1440') await expect(gap).toHaveCSS('cursor', 'pointer');
  await gap.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(gap).toBeFocused();
  await gap.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('dialog').getByRole('button', { name: /Slot Player 5/ })
  ).toBeEnabled();
  await expect(page.getByRole('button', { name: /Hacer Capitán/i })).toHaveCount(0);
  await page.getByRole('button', { name: /Reserve Alero/ }).click();
  await expect(court.getByText('Alero vacío', { exact: true })).toHaveCount(0);
  await expect(court.getByText('Reserve Alero', { exact: true })).toBeVisible();
  await save.click();
  await expect.poll(() => submitted.length).toBe(2);
  expect(submitted[1].playersID).toEqual(ids.map((id, i) => (i === 3 ? '99111' : String(id))));
  expect(submitted[1].reservesID).toEqual([null, null, null]);
});
