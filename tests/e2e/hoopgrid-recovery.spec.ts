import { test, expect } from 'playwright/test';

test('Hoopgrid replaces a stale board with a retry state when the requested date fails', async ({
  page,
}, info) => {
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE || info.project.name !== 'iphone-13');
  const current = '2026-05-18';
  const previous = '2026-05-17';
  const dates = [current, previous];
  let previousAttempts = 0;

  await page.route('**/api/hoopgrid/list', (route) =>
    route.fulfill({
      json: {
        challenges: dates.map((gameDate, index) => ({ gameDate, number: 18 - index })),
      },
    })
  );
  await page.route('**/api/hoopgrid/today?*', (route) => {
    const date = new URL(route.request().url()).searchParams.get('date');
    if (date === previous && ++previousAttempts === 1) {
      return route.fulfill({ status: 500, json: { error: 'Temporary error' } });
    }
    const label = date === previous ? 'Previous puzzle' : 'Current puzzle';
    const clues = [0, 1, 2].map((index) => ({ type: 'team', value: 'MAD', label: label + index }));
    return route.fulfill({
      json: {
        challenge: {
          id: date,
          gameDate: date,
          number: date === previous ? 17 : 18,
          rows: clues,
          cols: clues,
          possibleCounts: Array(9).fill(1),
        },
        userGuesses: [],
      },
    });
  });

  await page.goto('/login?callbackUrl=%2Fhoopgrid%3Fdate%3D2026-05-18');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Current puzzle0').first()).toBeVisible();
  await page.getByTitle('Reto Anterior').click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'No se pudo cargar el reto.' })
  ).toBeVisible();
  await expect(page.getByText('Current puzzle0')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByText('Previous puzzle0').first()).toBeVisible();
  expect(previousAttempts).toBe(2);
});
