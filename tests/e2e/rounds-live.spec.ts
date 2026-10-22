import { test, expect } from './fixtures';
import { waitForScreenshotPaint } from './screenshot-ready';
import type { Page } from 'playwright/test';

const manager = {
  id: '7',
  name: 'Round Manager',
  icon: null,
  color_index: 0,
  points: 0,
  round_points: 0,
  total_points: 0,
  ideal_points: 0,
  participated: true,
};
const player = {
  player_id: 101,
  name: 'Live Player',
  position: 'Base',
  img: null,
  role: 'titular',
  points: 0,
  raw_points: null,
  calculated: false,
};
const data = (users: unknown[]) => ({ global: {}, idealLineup: [], globalIdealPoints: 0, users });
async function login(page: Page) {
  await page.goto('/login?callbackUrl=%2Frounds');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/rounds$/);
}
async function mockList(page: Page) {
  await page.route('**/api/rounds/list', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          rounds: [
            { round_id: 5142, round_name: 'Jornada 7', status: 'live' },
            { round_id: 5143, round_name: 'Jornada 8', status: 'upcoming' },
          ],
          users: [manager],
          defaultRoundId: 5142,
        },
      },
    })
  );
}

test.beforeEach(async ({ page }, info) => {
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE || !info.project.name.startsWith('desktop'),
    'Desktop disposable fixture only.'
  );
  await mockList(page);
});

test('live squad survives incomplete background analysis and selector has no scroll', async ({
  page,
}) => {
  await page.route('**/api/rounds/stats?**', async (route) => {
    const mode = new URL(route.request().url()).searchParams.get('mode');
    const users =
      mode === 'quick'
        ? [{ ...manager, lineup: { players: [player] }, lineupStatus: 'available' }]
        : [manager];
    await route.fulfill({ json: { success: true, data: data(users) } });
  });
  await login(page);
  await expect(page.getByText('Live Player', { exact: true })).toBeVisible();
  await expect(page.getByText('Jornada en directo', { exact: false })).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true }).first()).toBeVisible();
  const selector = page.getByRole('group', { name: 'Vista de alineación' });
  await expect(selector).toBeVisible();
  expect(
    await selector.evaluate(
      (element) =>
        element.scrollHeight <= element.clientHeight && element.scrollWidth <= element.clientWidth
    )
  ).toBe(true);
  await selector.getByRole('button', { name: 'Mi Ideal', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Mi Alineación Perfecta', { exact: true })).toBeVisible();
  const green = await selector
    .getByRole('button', { name: 'Mi Ideal', exact: true })
    .evaluate((button) => getComputedStyle(button).backgroundColor);
  await selector.getByRole('button', { name: 'Global', exact: true }).click();
  const purple = await selector
    .getByRole('button', { name: 'Global', exact: true })
    .evaluate((button) => getComputedStyle(button).backgroundColor);
  await selector.getByRole('button', { name: 'Alineación', exact: true }).click();
  const orange = await selector
    .getByRole('button', { name: 'Alineación', exact: true })
    .evaluate((button) => getComputedStyle(button).backgroundColor);
  expect(new Set([orange, green, purple]).size).toBe(3);
  await expect(page.getByText('Live Player', { exact: true })).toBeVisible();
});

test('late previous-round response cannot replace the newly selected round', async ({ page }) => {
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let arrived!: () => void;
  const requested = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route('**/api/rounds/stats?**', async (route) => {
    const round = new URL(route.request().url()).searchParams.get('roundId');
    if (round === '5142') {
      arrived();
      await delayed;
    }
    await route.fulfill({
      json: {
        success: true,
        data: data(round === '5142' ? [{ ...manager, lineup: { players: [player] } }] : [manager]),
      },
    });
  });
  await login(page);
  await requested;
  await page.getByRole('button', { name: 'Jornada siguiente' }).click();
  await expect(page.getByText('La jornada aún no ha comenzado.', { exact: true })).toBeVisible();
  release();
  await expect(page.getByText('Live Player', { exact: true })).toHaveCount(0);
  await expect(page.getByText('La jornada aún no ha comenzado.', { exact: true })).toBeVisible();
});

test('switching managers never keeps the previous manager on the court', async ({ page }) => {
  const rival = { ...manager, id: '8', name: 'Other Manager' };
  const rivalPlayer = { ...player, player_id: 102, name: 'Other Player' };
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/rounds/stats?**', async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const users = [manager, rival].map((user) => ({
      ...user,
      lineup: { players: [user.id === manager.id ? player : rivalPlayer] },
      lineupStatus: 'available',
    }));
    if (params.get('mode') === 'quick' && params.get('userId') === rival.id) await delayed;
    await route.fulfill({
      json: {
        success: true,
        data: data(
          params.get('mode') === 'quick'
            ? users.filter((user) => user.id === params.get('userId'))
            : users
        ),
      },
    });
  });
  try {
    await login(page);
    await expect(page.getByText('Live Player', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ver alineación de Other Manager' }).click();
    await expect(page.getByText('Other Player', { exact: true })).toBeVisible();
    await expect(page.getByText('Live Player', { exact: true })).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.getByText('Other Player', { exact: true })).toBeVisible();
});

test('unavailable squad offers an application-data retry', async ({ page }) => {
  let ready = false;
  const backgroundLoaded = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/rounds/stats' && url.searchParams.get('mode') === 'full';
  });
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: data([
          {
            ...manager,
            lineupStatus: ready ? 'available' : 'error',
            ...(ready ? { lineup: { players: [player] } } : {}),
          },
        ]),
      },
    })
  );
  await login(page);
  await backgroundLoaded;
  await expect(
    page.getByText('No se ha podido cargar la alineación.', { exact: true })
  ).toBeVisible();
  ready = true;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByText('Live Player', { exact: true })).toBeVisible();
});

test('round controls, empty state and standings stay compact as the bench changes', async ({
  page,
}, info) => {
  let available = false;
  const users = Array.from({ length: 6 }, (_, index) => ({
    ...manager,
    id: String(7 + index),
    name: `Round Manager ${index + 1}`,
  }));
  const backgroundLoaded = page.waitForResponse(
    (response) =>
      response.url().includes('/api/rounds/stats?') && response.url().includes('mode=full')
  );
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: data(
          users.map((user) => ({
            ...user,
            lineupStatus: available ? 'available' : 'missing',
            lineup: {
              players: available
                ? Array.from({ length: 10 }, (_, index) => ({
                    ...player,
                    player_id: 101 + index,
                    name: index === 0 ? 'Live Player' : `Player ${index + 1}`,
                    position: index % 5 < 2 ? 'Base' : index % 5 < 4 ? 'Alero' : 'Pivot',
                    role: index < 5 ? 'titular' : index === 5 ? '6th_man' : 'suplente',
                  }))
                : [],
            },
          }))
        ),
      },
    })
  );
  await login(page);
  await backgroundLoaded;
  const standings = page.getByRole('region', { name: 'Clasificación de la jornada' });
  const court = page.getByRole('region', { name: 'Alineación de la jornada' });
  await expect(standings.getByRole('button', { name: /^Ver alineación/ })).toHaveCount(6);
  await expect(
    page.getByText('Alineación pendiente de sincronización.', { exact: true })
  ).toBeVisible();
  const before = await standings.boundingBox();
  expect(before!.height).toBeLessThan(520);
  expect((await court.boundingBox())!.height).toBeLessThan(430);
  const select = page.getByRole('combobox', { name: 'Jornada', exact: true });
  await expect(select).toHaveValue('5142');
  expect((await select.boundingBox())!.height).toBeLessThanOrEqual(48);
  await page
    .locator('#estadisticas-de-la-ronda')
    .screenshot({ path: info.outputPath('rounds-empty.png') });
  await page.locator('html').evaluate((element) => element.setAttribute('data-theme', 'light'));
  await page
    .locator('#estadisticas-de-la-ronda')
    .screenshot({ path: info.outputPath('rounds-empty-light.png') });
  await page.locator('html').evaluate((element) => element.setAttribute('data-theme', 'dark'));

  available = true;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByText('Live Player', { exact: true })).toBeVisible();
  await expect(page.getByText('Player 10', { exact: true })).toBeVisible();
  const after = await standings.boundingBox();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(2);
  const rowHeights = await standings
    .getByRole('button', { name: /^Ver alineación/ })
    .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
  expect(Math.max(...rowHeights) - Math.min(...rowHeights)).toBeLessThan(1);
  await waitForScreenshotPaint(page);
  await page
    .locator('#estadisticas-de-la-ronda')
    .screenshot({ path: info.outputPath('rounds-populated.png') });
  await select.selectOption('5143');
  await expect(page.getByText('Próximamente', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jornada anterior' }).click();
  await expect(select).toHaveValue('5142');
});
