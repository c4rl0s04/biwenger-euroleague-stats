import { test, expect } from './fixtures';

test('News retains desktop ticker and phone disclosure', async ({ page, request }, info) => {
  test.setTimeout(180000);
  test.skip(!process.env.BIWENGER_E2E_DISPOSABLE, 'Requires synthetic local league.');
  const items = [
    {
      type: 'transfer',
      text: 'FICHAJE: Fixture Guard (Base) pasa de Mercado a Fixture Manager por 200.000 €',
      timestamp: 1,
    },
    { type: 'price_up', text: 'MERCADO: Fixture Guard sube 200.000 € hoy', timestamp: 2 },
    { type: 'result', text: 'RESULTADO: Fixture Madrid 84 - 79 Fixture Athens', timestamp: 3 },
  ];
  await page.route('**/api/news', (route) =>
    route.fulfill({ json: { success: true, data: items } })
  );
  await page.goto('/login?callbackUrl=%2Fdashboard');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // Request contexts bypass the browser's deterministic ticker interception.
  for (const client of [request, page.request]) {
    const response = await client.get('/api/news?userId=ignored&limit=invalid');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe(
      'public, max-age=300, stale-while-revalidate=60'
    );
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.data)).toBe(true);
    for (const item of payload.data)
      expect(Object.keys(item).sort()).toEqual(['text', 'timestamp', 'type']);
  }
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  const snapshots =
    process.platform === 'darwin' && ['iphone-13', 'desktop-1440'].includes(info.project.name);
  await page.evaluate(() => document.fonts.ready);
  if (phone) {
    const strip = page.locator('.mobile-news-strip');
    await expect(strip).toBeVisible();
    if (snapshots)
      await expect(strip).toHaveScreenshot('news-phone.png', {
        animations: 'disabled',
        mask: [strip.locator('.mobile-news-headline')],
      });
    await strip.locator('summary').click();
    await expect(strip).toHaveAttribute('open', '');
    const count = await strip.locator('li').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
    await expect(strip.locator('.mobile-news-expand')).toHaveText(`+${count}`);
    for (const title of await strip.locator('li strong').allTextContents())
      expect(title).toMatch(/^(FICHAJE|MERCADO|PRÓXIMO|RESULTADO): /);
    await strip.locator('summary').click();
    await expect(strip).not.toHaveAttribute('open', '');
  } else {
    const ticker = page.getByText('Breaking', { exact: true }).locator('..');
    await expect(ticker).toBeVisible();
    await expect(ticker).toContainText(items[0].text);
    await page.addStyleTag({
      content: '.rfm-marquee { animation: none !important; transform: none !important; }',
    });
    if (snapshots)
      await expect(ticker).toHaveScreenshot('news-desktop.png', { animations: 'disabled' });
    await page.locator('a[href="/standings"]').first().click();
    await expect(page).toHaveURL(/\/standings$/);
    await expect(page.getByText('Breaking', { exact: true })).toBeVisible();
    if (info.project.name === 'desktop-1440') {
      // Isolate deliberate failure from the unchanged global browser error guards.
      const negative = await page.context().newPage();
      const errors: string[] = [];
      const exceptions: string[] = [];
      negative.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      negative.on('pageerror', (e) => exceptions.push(e.message));
      await negative.route('**/_vercel/insights/script.js*', (r) =>
        r.fulfill({ body: '', contentType: 'application/javascript' })
      );
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let requested!: () => void;
      const started = new Promise<void>((resolve) => {
        requested = resolve;
      });
      await negative.route('**/api/news', async (r) => {
        requested();
        await gate;
        await r.fulfill({ json: { success: true, data: [] } });
      });
      try {
        await negative.goto('/standings');
        await started;
        await expect(negative.getByText('Breaking', { exact: true })).toHaveCount(0);
        const emptyResponse = negative.waitForResponse(
          (r) => new URL(r.url()).pathname === '/api/news'
        );
        release();
        await emptyResponse;
        await expect(negative.getByText('Breaking', { exact: true })).toHaveCount(0);
        await negative.unroute('**/api/news');
        await negative.route('**/api/news', (r) =>
          r.fulfill({ json: { success: false, error: 'Synthetic News failure' } })
        );
        await negative.reload();
        await expect
          .poll(() => errors.filter((e) => e.includes('Synthetic News failure')).length)
          .toBe(1);
        await expect(negative.getByText('Breaking', { exact: true })).toHaveCount(0);
        expect(errors).toHaveLength(1);
        expect(exceptions).toEqual([]);
      } finally {
        release();
        await negative.close();
      }
    }
  }
});
