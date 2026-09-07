import type { Locator, Page, TestInfo } from 'playwright/test';
import { test, expect } from './fixtures';

// Baselines are captured from the unchanged Manager Profile at 1a2c0c68
// (application code identical to production 084bd9fe), using this same seed.
const managerPath = '/user/99001';
const sections = [
  { slug: 'season', title: 'Temporada', desktop: '#season-performance' },
  { slug: 'squad', title: 'Plantilla', desktop: '#squad-analysis' },
  { slug: 'evolution', title: 'Evolución', desktop: '#points-evolution' },
  { slug: 'contributors', title: 'Contribuidores', desktop: '#top-contributors' },
  { slug: 'competitions', title: 'Competiciones', desktop: '#tournaments' },
] as const;

async function login(page: Page, callbackPath = managerPath) {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackPath}$`));
}

// Fixture-specific verification of Next's pinned HTML transport, not a general Flight decoder.
function assertStreamedRedirect({ html, destination }: { html: string; destination: string }) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const meta = document.querySelector('meta#__next-page-redirect');
  if (
    meta &&
    (meta.getAttribute('http-equiv') !== 'refresh' ||
      meta.getAttribute('content') !== `1;url=${destination}`)
  )
    throw new Error('Unexpected HTML redirect');
  const prefix = 'self.__next_f.push(';
  let flight = '';
  for (const script of Array.from(document.scripts)) {
    const source = script.textContent ?? '';
    if (!source.startsWith(prefix)) continue;
    if (!source.endsWith(')')) throw new Error('Malformed inline Flight wrapper');
    const chunk: unknown = JSON.parse(source.slice(prefix.length, -1));
    if (
      !Array.isArray(chunk) ||
      chunk.length !== 2 ||
      chunk[0] !== 1 ||
      typeof chunk[1] !== 'string'
    )
      throw new Error('Unsupported inline Flight payload');
    flight += chunk[1];
  }
  // Length-prefixed text can contain newlines that resemble records. Fail closed
  // instead of interpreting an unsupported representation as a successful redirect.
  if (/^[0-9a-f]+:T/m.test(flight)) throw new Error('Unsupported length-prefixed Flight text');
  let redirects = 0;
  for (const line of flight.split('\n')) {
    const record = /^[0-9a-f]+:E(.+)$/.exec(line);
    if (!record) continue;
    const error: unknown = JSON.parse(record[1]);
    if (
      !error ||
      typeof error !== 'object' ||
      !('digest' in error) ||
      error.digest !== `NEXT_REDIRECT;replace;${destination};307;`
    )
      throw new Error('Unexpected Flight error or redirect');
    redirects++;
  }
  if (!redirects) throw new Error('Missing streamed redirect');
}

async function expectDesktopSectionRedirect(page: Page, section: string) {
  // Share the browser's session and user-agent without replacing its live document.
  // Repeated page.goto calls cancel WebKit shell prefetches, even after networkidle.
  const response = await page.context().request.get(`${managerPath}/${section}`, {
    maxRedirects: 0,
  });
  try {
    const destination = `${managerPath}#${section}`;
    if (response.status() === 307) {
      expect(response.headers().location).toBe(destination);
    } else {
      // This route can flush its loading boundary, then deliver the redirect as
      // a Flight error record. Parse the JSON payload without executing scripts.
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      await page.evaluate(assertStreamedRedirect, { html: await response.text(), destination });
    }
  } finally {
    await response.dispose();
  }
}

test('streamed Profile redirect checks reject false positives', async ({ page }) => {
  const destination = `${managerPath}#season`;
  const digest = `NEXT_REDIRECT;replace;${destination};307;`;
  const record = `a:E${JSON.stringify({ digest })}\n`;
  const script = (chunk: string) =>
    `<script>self.__next_f.push(${JSON.stringify([1, chunk])})</script>`;
  const check = (html: string) => page.evaluate(assertStreamedRedirect, { html, destination });
  await check(script(record));
  await check(script(record.slice(0, 12)) + script(record.slice(12)));
  await expect(check(`<p>${digest}</p>`)).rejects.toThrow('Missing streamed redirect');
  for (const incorrect of [
    digest.replace('#season', '#squad'),
    digest.replace('replace', 'push'),
    digest.replace('307', '308'),
  ])
    await expect(check(script(`a:E${JSON.stringify({ digest: incorrect })}\n`))).rejects.toThrow(
      'Unexpected Flight error or redirect'
    );
  await expect(check(script(record + 'b:E{"digest":"unexpected-error"}\n'))).rejects.toThrow(
    'Unexpected Flight error or redirect'
  );
  await expect(check('<script>self.__next_f.push([3,"YQ=="])</script>')).rejects.toThrow(
    'Unsupported inline Flight payload'
  );
  await expect(check('<script>self.__next_f.push([1,"broken"]</script>')).rejects.toThrow(
    'Malformed inline Flight wrapper'
  );
  await expect(check(script('b:Tff,fake\n' + record))).rejects.toThrow(
    'Unsupported length-prefixed Flight text'
  );
  await expect(
    check(
      `<meta id="__next-page-redirect" http-equiv="refresh" content="1;url=/login">${script(record)}`
    )
  ).rejects.toThrow('Unexpected HTML redirect');
});

async function capture(page: Page, testInfo: TestInfo, name: string, target?: Locator) {
  // Linux runs all semantic checks; Profile Linux visual baselines are still pending.
  // Never initialize those baselines from the migrated implementation.
  if (
    process.platform !== 'darwin' ||
    !['iphone-13', 'desktop-1440'].includes(testInfo.project.name)
  )
    return;
  await page.evaluate(() => document.fonts.ready);
  if (testInfo.project.name === 'desktop-1440') {
    if (name === 'manager-profile') {
      await page.locator('#points-evolution').scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page
            .locator('#points-evolution .recharts-bar-rectangle path')
            .evaluateAll(
              (bars) =>
                bars.length === 2 && bars.every((bar) => bar.getBoundingClientRect().height > 100)
            )
        )
        .toBe(true);
      await expect(page.locator('#points-evolution .recharts-label-list text')).toHaveText([
        '24',
        '31',
      ]);
    }
    // Capture a deliberate resting state, not incidental hover/scroll from login
    // or the preceding screenshot. Locator screenshots would scroll again.
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([0, 0]);
  }
  const options = {
    animations: 'disabled' as const,
    timeout: 60000,
    stylePath: 'tests/e2e/screenshot.css',
  };
  if (target && name === 'manager-evolution') {
    // Keep the SVG in the viewport while capturing: offscreen page clips can
    // omit filtered SVG bars even when their DOM geometry is already complete.
    await target.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator('#points-evolution .recharts-bar-rectangle path')
          .evaluateAll(
            (bars) =>
              bars.length === 2 && bars.every((bar) => bar.getBoundingClientRect().height > 100)
          )
      )
      .toBe(true);
    await expect(page.locator('#points-evolution .recharts-label-list text')).toHaveText([
      '24',
      '31',
    ]);
    await page.mouse.move(0, 0);
    await expect(target).toHaveScreenshot(`${name}.png`, options);
  } else if (target && testInfo.project.name === 'desktop-1440') {
    const bounds = await target.boundingBox();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0)
      throw new Error('Missing Profile screenshot target');
    const x = Math.floor(bounds.x);
    const y = Math.floor(bounds.y);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      ...options,
      fullPage: true,
      clip: {
        x,
        y,
        width: Math.ceil(bounds.x + bounds.width) - x,
        height: Math.ceil(bounds.y + bounds.height) - y,
      },
    });
  } else if (target) await expect(target).toHaveScreenshot(`${name}.png`, options);
  else
    await expect(page).toHaveScreenshot(`${name}.png`, {
      ...options,
      // The five section captures cover content below the desktop identity area.
      // A full-document overview can omit offscreen SVG bars despite DOM readiness.
      fullPage: !(testInfo.project.name === 'desktop-1440' && name === 'manager-profile'),
    });
}

test('Manager Profile preserves desktop and phone sections and interactions', async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE,
    'Requires the synthetic league from test:e2e:local.'
  );
  await login(page);
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) {
    await expect(
      page.getByRole('heading', { name: 'Fixture Manager', exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText('2 jornadas · 1 victorias', { exact: true })).toBeVisible();
    for (const section of sections)
      await expect(page.locator(`a[href="${managerPath}/${section.slug}"]`)).toBeVisible();
  } else {
    await expect(
      page.getByRole('heading', { name: 'Perfil de Fixture Manager', exact: true })
    ).toBeVisible();
    await expect(page.getByText('Dominio de Liga (H2H Virtual)', { exact: true })).toBeVisible();
    await expect(
      page.locator('#squad-analysis').getByText('Fixture Guard', { exact: true })
    ).toBeVisible();
    await expect(
      page.locator('#top-contributors').getByText('Fixture Contributor 01', { exact: true })
    ).toBeVisible();
    await expect(page.locator('a[href="/tournaments/99301"]').first()).toBeVisible();
    await expect(page.locator('a[href="/tournaments/99302"]').first()).toBeVisible();
    // Recharts animates in JavaScript; screenshot CSS animation controls cannot
    // settle it. Its score labels appear only after the bars finish animating.
    await expect(page.locator('#points-evolution .recharts-label-list text')).toHaveText([
      '24',
      '31',
    ]);
  }
  await capture(page, testInfo, 'manager-profile');

  for (const section of sections) {
    if (phone) await page.locator(`a[href="${managerPath}/${section.slug}"]`).click();
    else await expectDesktopSectionRedirect(page, section.slug);
    if (phone) {
      await expect(page).toHaveURL(new RegExp(`${managerPath}/${section.slug}$`));
      await expect(
        page.getByRole('heading', { name: section.title, exact: true }).first()
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Detalle', exact: true })).toBeVisible();
      if (section.slug === 'season') {
        // Legacy generic normalization selects the first array (empty last_transfers).
        await expect(
          page.getByText('No hay datos disponibles para esta vista.', { exact: true })
        ).toBeVisible();
      } else if (section.slug === 'squad') {
        // Legacy normalization selects top_rising rather than the full players array.
        await expect(
          page.locator('a[href="/player/99101"]').getByText('Fixture Guard', { exact: true })
        ).toBeVisible();
      } else if (section.slug === 'evolution') {
        await expect(page.getByText('Jornada 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Jornada 2', { exact: true })).toBeVisible();
      } else if (section.slug === 'contributors') {
        await expect(
          page
            .locator('a[href="/player/99201"]')
            .getByText('Fixture Contributor 01', { exact: true })
        ).toBeVisible();
        await expect(page.getByText('Fixture Contributor 12', { exact: true })).toBeVisible();
      } else {
        // tournament_name is deliberately not a generic TITLE_KEY in the old screen.
        await expect(page.getByText('Registro 1', { exact: true })).toBeVisible();
        await expect(page.getByText('Registro 2', { exact: true })).toBeVisible();
      }
      await capture(page, testInfo, `manager-${section.slug}`);
      await page.locator(`a[href="${managerPath}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${managerPath}$`));
    } else {
      // Redirect contracts were checked above; presentation stays on the live profile.
      await expect(page).toHaveURL(new RegExp(`${managerPath}$`));
      const target = page.locator(section.desktop);
      await expect(target).toBeVisible();
      await capture(page, testInfo, `manager-${section.slug}`, target);
    }
  }

  if (!phone) {
    if (testInfo.project.name.startsWith('desktop-')) {
      await page.locator('#points-evolution .recharts-bar-rectangle path').nth(1).hover();
      const tooltip = page.locator('#points-evolution .recharts-tooltip-wrapper');
      await expect(tooltip).toContainText('Jornada 2');
      await expect(tooltip).toContainText('31 pts');
      await page.mouse.move(0, 0);
    }
    const expand = page.getByRole('button', { name: 'Ver otros 2 jugadores' });
    await expand.click();
    await expect(
      page.locator('#top-contributors').getByText('Fixture Contributor 12', { exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ocultar historial completo' }).click();
    await expect(
      page.locator('#top-contributors').getByText('Fixture Contributor 12', { exact: true })
    ).toHaveCount(0);
    await expect(page.locator('#top-contributors a[href="/player/99201"]')).toHaveCount(1);
  }
  await page.waitForLoadState('networkidle');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);
});

test('missing Manager Profile preserves the existing empty presentation', async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.BIWENGER_E2E_DISPOSABLE,
    'Requires the synthetic league from test:e2e:local.'
  );
  // Arrive directly: hard-navigation from the valid profile aborts its link prefetches in WebKit.
  await login(page, '/user/1');
  const phone =
    (await page.locator('[data-presentation]').getAttribute('data-presentation')) === 'phone';
  if (phone) await expect(page.getByText('Mánager no encontrado.', { exact: true })).toBeVisible();
  else {
    await expect(
      page.getByRole('heading', { name: 'Manager no encontrado', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver a la clasificación' })).toHaveAttribute(
      'href',
      '/standings'
    );
  }
  await capture(page, testInfo, 'manager-not-found');
});
