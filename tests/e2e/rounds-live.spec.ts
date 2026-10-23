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
  await expect(
    page.getByRole('region', { name: 'Alineación de la jornada' }).getByText('/', { exact: true })
  ).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toHaveCount(0);
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

test('one global ideal keeps scored court and bench players when the selected manager changes', async ({
  page,
}, info) => {
  const other = { ...manager, id: '8', name: 'Other Manager' };
  const idealLineup = [36, 35, 34, 33, 32, 31, 30, 29, 28, 0].map((points, index) => ({
    player_id: 201 + index,
    name: `Global ${index + 1}`,
    img: null,
    points,
    stats_points: points,
    position: index % 5 < 2 ? 'Base' : index % 5 < 4 ? 'Alero' : 'Pivot',
    role: index < 5 ? 'titular' : index === 5 ? '6th_man' : 'bench',
    is_captain: index === 0,
    multiplier: index === 0 ? 2 : index < 5 ? 1 : index === 5 ? 0.75 : 0.5,
  }));
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { ...data([manager, other]), idealLineup, globalIdealPoints: 273 },
      },
    })
  );
  await login(page);
  await expect(page.getByText('Panel de Jornada', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Global', exact: true }).click();
  const court = page.getByRole('region', { name: 'Alineación de la jornada' });
  await expect(court.getByText('36 pts', { exact: true })).toBeVisible();
  await expect(page.getByText('31 pts', { exact: true })).toBeVisible();
  await expect(page.getByText('0 pts', { exact: true })).toBeVisible();
  await expect(page.getByText('273', { exact: true })).toBeVisible();
  await expect(court.getByText('Pendiente', { exact: true })).toHaveCount(0);
  await expect(page.getByText('null pts', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver alineación de Other Manager' }).click();
  await expect(court.getByText('Global 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Global 10', { exact: true })).toBeVisible();
  await expect(page.getByText('273', { exact: true })).toBeVisible();
  await waitForScreenshotPaint(page);
  await page
    .locator('#estadisticas-de-la-ronda')
    .screenshot({ path: info.outputPath('rounds-global-scored.png') });
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
  const select = page.getByRole('button', { name: 'Jornada', exact: true });
  await expect(select).toHaveText('Jornada 7');
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
  await select.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(select).toHaveText('Jornada 7');
  await select.click();
  const nextRound = page.getByRole('option', { name: 'Jornada 8', exact: true });
  await expect(nextRound).toBeVisible();
  expect(
    await nextRound
      .locator('span')
      .first()
      .evaluate((el) => getComputedStyle(el).fontSize)
  ).toBe('14px');
  await page
    .locator('#estadisticas-de-la-ronda')
    .screenshot({ path: info.outputPath('rounds-dropdown.png') });
  await nextRound.click();
  await expect(select).toHaveText('Jornada 8');
  await page.getByRole('button', { name: 'Jornada anterior' }).click();
  await expect(select).toHaveText('Jornada 7');
});

test('finished round uses slashes for missing court and bench scores and retains zero', async ({
  page,
}) => {
  await page.route('**/api/rounds/list', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          rounds: [{ round_id: 5141, round_name: 'Jornada 6', status: 'finished' }],
          users: [manager],
          defaultRoundId: 5141,
        },
      },
    })
  );
  const players = [
    { ...player, player_id: 101, name: 'No recorded score', raw_points: null },
    { ...player, player_id: 102, name: 'Recorded zero', raw_points: 0, points: 0 },
    { ...player, player_id: 103, name: 'Bench no score', raw_points: null, role: 'bench' },
  ];
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: data([{ ...manager, lineupStatus: 'available', lineup: { players } }]),
      },
    })
  );
  await login(page);
  const court = page.getByRole('region', { name: 'Alineación de la jornada' });
  await expect(court.getByText('/', { exact: true })).toHaveCount(1);
  await expect(court.getByText('0 pts', { exact: true })).toBeVisible();
  await expect(page.getByText('/', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Pendiente', { exact: true })).toHaveCount(0);
});

test('foundation round picker supports keyboard selection, dismissal and boundary navigation', async ({
  page,
}) => {
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({ json: { success: true, data: data([manager]) } })
  );
  await login(page);
  const picker = page.getByRole('button', { name: 'Jornada', exact: true });
  await expect(page.getByRole('button', { name: 'Jornada anterior' })).toBeDisabled();
  await picker.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox', { name: 'Jornada' })).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(picker).toHaveText('Jornada 8');
  await expect(picker).toBeFocused();
  await expect(page.getByRole('button', { name: 'Jornada siguiente' })).toBeDisabled();
  await picker.press('Enter');
  await page.keyboard.press('Home');
  await page.keyboard.press('Escape');
  await expect(picker).toHaveText('Jornada 8');
  await expect(picker).toBeFocused();
  await picker.press('Enter');
  await page.getByRole('heading', { name: 'Estadísticas de la Ronda' }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('history controls, sort headers and analytical details work with keyboard in both themes', async ({
  page,
}, info) => {
  const second = { ...manager, id: '8', name: 'Comparison Manager' };
  const history = [95, 90, 85, 50].map((efficiency, index) => ({
    round_id: 5100 + index,
    round_number: index + 1,
    actual_points: efficiency,
    ideal_points: 100,
    efficiency,
    participated: true,
  }));
  await page.route('**/api/rounds/list', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          rounds: [{ round_id: 5142, round_name: 'Jornada 7', status: 'live' }],
          users: [manager, second],
          defaultRoundId: 5142,
        },
      },
    })
  );
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({ json: { success: true, data: data([manager, second]) } })
  );
  await page.route('**/api/rounds/history?**', (route) =>
    route.fulfill({ json: { success: true, data: { history } } })
  );
  await page.route('**/api/rounds/all-history', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { allUsersHistory: [manager, second].map((user) => ({ userId: user.id, history })) },
      },
    })
  );
  await page.route('**/api/rounds/leaderboard', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          leaderboard: [manager, second].map((user, index) => ({
            userId: user.id,
            avgEfficiency: 90 - index,
            totalLost: 10 + index,
            bestActual: 95,
            worstActual: 50,
            bestIdeal: 100,
            maxLost: 50,
            bestEfficiency: 95,
            worstEfficiency: 50,
            bestActualRound: 1,
            bestIdealRoundNum: 1,
            maxLostRoundNum: 4,
            bestEffRound: 1,
            worstEffRound: 4,
            worstActualRound: 4,
          })),
        },
      },
    })
  );
  await login(page);
  for (const theme of ['dark', 'light']) {
    await page
      .locator('html')
      .evaluate((element, value) => element.setAttribute('data-theme', value), theme);
    const metric = page
      .getByRole('group', { name: 'Métricas del historial' })
      .getByRole('button', { name: 'Puntos Reales' });
    await expect(metric).toHaveAttribute('aria-pressed', 'true');
    await metric.click();
    await expect(metric).toHaveAttribute('aria-pressed', 'false');
    await metric.click();
    const add = page.getByRole('button', { name: 'Añadir usuario a comparar' });
    await add.scrollIntoViewIfNeeded();
    await add.focus();
    await page.keyboard.press('Enter');
    const popover = page.locator('[popover]:popover-open');
    await expect(popover).toBeVisible();
    await popover.getByRole('button', { name: 'Comparison Manager' }).click();
    await expect(
      page.getByRole('button', { name: 'Quitar Comparison Manager de la comparación' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Quitar Comparison Manager de la comparación' }).click();
    const table = page.getByRole('table', { name: 'Clasificación por eficiencia' });
    await table.getByRole('button', { name: 'Eff', exact: true }).click();
    await expect(table.getByRole('columnheader', { name: 'Eff', exact: true })).toHaveAttribute(
      'aria-sort',
      theme === 'dark' ? 'ascending' : 'descending'
    );
    const cell = page.getByRole('button', { name: 'Round Manager, jornada 1: 95.0%' });
    await cell.scrollIntoViewIfNeeded();
    await cell.focus();
    await page.keyboard.press('Enter');
    await expect(popover).toContainText('Real: 95 · Ideal: 100');
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
    const segment = page.getByRole('button', { name: 'Round Manager: 95%+, 1 jornadas' });
    await segment.focus();
    await page.keyboard.press('Enter');
    await expect(popover).toContainText('95%+: 1 jornadas');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('table', { name: 'Desglose por jornada' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
    await waitForScreenshotPaint(page);
    await page
      .locator('#comparativa-de-liga')
      .screenshot({ path: info.outputPath(`rounds-analytics-${theme}.png`) });
  }
  for (const width of [1279, 1281]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);
  }
});

test('section registration disappears with the conditional player section and unregisters on navigation', async ({
  page,
}) => {
  await page.route('**/api/rounds/list', (route) =>
    route.fulfill({
      json: { success: true, data: { rounds: [], users: [manager], defaultRoundId: null } },
    })
  );
  await login(page);
  await expect(page.getByText('Temporada en preparación', { exact: true })).toBeVisible();
  await expect(page.locator('a[href="/rounds#estadisticas-de-la-ronda"]')).toBeVisible();
  await expect(page.locator('a[href="/rounds#estadisticas-de-jugadores"]')).toHaveCount(0);
  await page.locator('a[href="/players"]').first().click();
  await expect(page.locator('a[href$="#estadisticas-de-la-ronda"]')).toHaveCount(0);
});

test('the whole player-leader card retains player navigation', async ({ page }) => {
  await page.route('**/api/rounds/stats?**', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          ...data([manager]),
          global: { mvp: { id: 99201, name: 'Navigation Leader', img: null, points: 19 } },
        },
      },
    })
  );
  await login(page);
  const card = page.getByRole('group', { name: 'MVP de la Jornada', exact: true });
  await expect(card).toBeVisible();
  await card.click({ position: { x: 8, y: 8 } });
  await expect(page).toHaveURL(/\/player\/99201(?:\/overview)?$/);
});
