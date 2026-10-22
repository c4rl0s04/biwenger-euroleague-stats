import { test, expect } from './fixtures';
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
  await selector.getByRole('button', { name: 'Alineación', exact: true }).click();
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
