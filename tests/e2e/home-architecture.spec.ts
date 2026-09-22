import { test, expect } from './fixtures';

test('Home preserves its desktop landing and phone activity composition', async ({
  page,
  request,
}, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires the synthetic local league.');
  await page.route('**/api/news', (route) => route.fulfill({ json: { success: true, data: [] } }));
  await page.goto('/login?callbackUrl=%2F');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/$/);
  const anonymous = await request.get('/api/home/activity');
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()['cache-control']).toBe('private, no-store');
  const response = await page.request.get('/api/home/activity?type=all');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('private, no-store');
  expect(Object.keys(await response.json()).sort()).toEqual(['hasMore', 'items', 'nextCursor']);
  const forbidden = await page.request.get('/api/home/activity?userId=99001');
  expect(forbidden.status()).toBe(400);
  const landing = await request.get('/api/landing-stats');
  expect(landing.status()).toBe(200);
  expect(landing.headers()['cache-control']).toBe('public, max-age=300, stale-while-revalidate=60');
  expect((await landing.json()).success).toBe(true);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  const snapshots =
    process.platform === 'darwin' && ['iphone-13', 'desktop-1440'].includes(info.project.name);
  await page.evaluate(() => document.fonts.ready);
  if (phone) {
    await expect(page.locator('.mobile-home-feed-section')).toBeVisible();
    await expect(page.locator('.mobile-home-pulse')).toBeVisible();
    if (snapshots)
      await expect(page.locator('.mobile-home-screen')).toHaveScreenshot('home-phone.png', {
        animations: 'disabled',
        mask: [page.locator('time')],
      });
    for (const [label, filter] of [
      ['Fichajes', 'transfers'],
      ['Jornadas + primas', 'rounds'],
      ['MVP + ideal', 'highlights'],
      ['Porras', 'predictions'],
      ['Resultados', 'results'],
    ] as const) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`activity=${filter}`));
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await expect(page.locator('.mobile-home-filter-loading')).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(page).not.toHaveURL(/activity=/);
    const ideal = page.locator('.mobile-home-highlight-details').first();
    await ideal.locator('summary').click();
    await expect(ideal).toHaveAttribute('open', '');
    // The fixture's position distribution produces three starters plus five bench players.
    await expect(ideal.locator('li')).toHaveCount(8);
    await ideal.locator('summary').click();
    await expect(ideal).not.toHaveAttribute('open', '');
  } else {
    await expect(page.getByRole('heading', { name: /Páginas Disponibles/i })).toBeVisible();
    await expect(page.getByText(/\d+ Usuarios/)).toBeVisible();
    if (snapshots)
      await expect(page.locator('header.hero-gradient')).toHaveScreenshot('home-desktop.png', {
        animations: 'disabled',
      });
    await expect(page.locator('main a[href="/dashboard"]')).toBeVisible();
  }
});

test('Home phone preserves loading, retry, pagination deduplication and filter snapshots', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE || info.project.name !== 'iphone-13',
    'Synthetic phone interaction contract.'
  );
  await page.goto('/login?callbackUrl=%2F');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/$/);
  // Deliberate HTTP failure is isolated from the shared fixture's normal error guards.
  const negative = await page.context().newPage();
  const errors: string[] = [];
  const exceptions: string[] = [];
  negative.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  negative.on('pageerror', (error) => exceptions.push(error.message));
  await negative.route('**/_vercel/insights/script.js*', (r) =>
    r.fulfill({ body: '', contentType: 'application/javascript' })
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const requested = new Promise<void>((resolve) => {
    started = resolve;
  });
  let transfers = 0;
  const cursors: Array<string | null> = [];
  const event = (id: number) => ({
    id: `admin_bonus:${id}`,
    type: 'admin_bonus',
    occurredAt: '2026-01-01T00:00:00Z',
    recipient: { id: '99001', name: 'Fixture Manager', icon: null, colorIndex: 0 },
    amount: id,
    description: `Synthetic bonus ${id}`,
  });
  await negative.route('**/api/home/activity*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('type') !== 'transfers')
      return route.fulfill({ json: { items: [], hasMore: false, nextCursor: null } });
    transfers++;
    cursors.push(url.searchParams.get('cursor'));
    if (transfers === 1) {
      started();
      await gate;
      return route.fulfill({ status: 500, json: { error: 'Synthetic failure' } });
    }
    return route.fulfill({
      json:
        transfers === 2
          ? { items: [event(1)], hasMore: true, nextCursor: 'synthetic-next' }
          : { items: [event(1), event(2)], hasMore: false, nextCursor: null },
    });
  });
  try {
    await negative.goto('/');
    await negative.getByRole('button', { name: 'Fichajes', exact: true }).click();
    await requested;
    await expect(negative.locator('.mobile-home-filter-loading')).toBeVisible();
    release();
    await expect(negative.locator('.mobile-home-feed-error[role="alert"]')).toHaveText(
      'No se pudo cargar esta categoría.'
    );
    await negative.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(negative.getByText('Synthetic bonus 1', { exact: true })).toHaveCount(1);
    await negative.locator('.mobile-home-feed-sentinel').scrollIntoViewIfNeeded();
    await expect(negative.getByText('Synthetic bonus 2', { exact: true })).toHaveCount(1);
    await expect(negative.getByText('Synthetic bonus 1', { exact: true })).toHaveCount(1);
    expect(cursors).toEqual([null, null, 'synthetic-next']);
    await negative.getByRole('button', { name: 'Resultados', exact: true }).click();
    await expect(negative.locator('.mobile-home-feed-empty')).toBeVisible();
    await negative.getByRole('button', { name: 'Fichajes', exact: true }).click();
    await expect(negative.getByText('Synthetic bonus 2', { exact: true })).toHaveCount(1);
    expect(transfers).toBe(3);
    expect(exceptions).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/500/);
  } finally {
    release();
    await negative.close();
  }
});
