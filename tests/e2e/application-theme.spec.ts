import { execFileSync } from 'node:child_process';
import type { Page } from 'playwright';
import { expect, test } from './fixtures';

async function expectTheme(page: Page, theme: 'dark' | 'light') {
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', theme);
  await expect(root).toHaveClass(theme);
  await expect(root).toHaveCSS('color-scheme', theme);
  const chrome = page.locator('meta[name="theme-color"]');
  await expect(chrome).toHaveCount(3);
  await expect(chrome.first()).toHaveAttribute('id', 'application-theme-color');
  await expect(chrome.first()).not.toHaveAttribute('media');
  await expect(chrome.first()).toHaveAttribute('content', theme === 'dark' ? '#050506' : '#f4f3f1');
  await expect(chrome.nth(1)).toHaveAttribute('content', '#050506');
  await expect(chrome.nth(2)).toHaveAttribute('content', '#f4f3f1');
}

// Dispatch a storage notification for isolated palette checks; native cross-tab delivery is tested below.
async function changePreference(page: Page, theme: string) {
  await page.evaluate((theme) => {
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: theme }));
  }, theme);
}

function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const rgb = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((n) => {
        const v = n / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

for (const theme of ['light', 'dark'] as const) {
  test(`stored ${theme} is applied before hydration and survives reload/navigation`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' });
    await page.addInitScript((theme) => {
      if (localStorage.getItem('theme') === null) localStorage.setItem('theme', theme);
    }, theme);
    let release = () => {};
    const hydration = new Promise<void>((resolve) => {
      release = resolve;
    });
    const holdScripts = async (route: import('playwright').Route) => {
      await hydration;
      await route.continue();
    };
    await page.route('**/_next/static/**/*.js*', holdScripts);
    const initialSession = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/auth/session'
    );
    try {
      await page.goto('/install', { waitUntil: 'commit' });
      // Real SSR content is visible while React's scripts are still held back.
      await expect(page.getByRole('heading', { name: /BiwengerStats en tu móvil/i })).toBeVisible();
      await expectTheme(page, theme);
      await expect(page.locator('body')).toHaveCSS(
        'background-color',
        theme === 'light' ? 'rgb(244, 243, 241)' : 'rgb(5, 5, 5)'
      );
    } finally {
      release();
    }
    // Network-idle can precede effects after deliberately delaying hydration.
    // Await the actual session read before a reload can cancel it in WebKit.
    const session = await initialSession;
    expect(session.ok()).toBeTruthy();
    await session.finished();
    await page.waitForLoadState('networkidle');
    await page.unroute('**/_next/static/**/*.js*', holdScripts);
    await expectTheme(page, theme);
    const reloadedSession = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/auth/session'
    );
    await page.reload();
    await (await reloadedSession).finished();
    await page.waitForLoadState('networkidle');
    await expectTheme(page, theme);
    await page.getByRole('link', { name: 'Abrir inicio de sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.waitForLoadState('networkidle');
    await expectTheme(page, theme);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(theme);
    if (['desktop-1440', 'iphone-13'].includes(testInfo.project.name)) {
      await testInfo.attach(`${theme}-existing-page`, {
        body: await page.screenshot({ path: testInfo.outputPath(`${theme}-existing-page.png`) }),
        contentType: 'image/png',
      });
    }
  });
}

test('system follows OS changes, explicit choices win, invalid historical values fall back', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/install');
  await page.waitForLoadState('networkidle');
  await expectTheme(page, 'light');
  await changePreference(page, 'system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expectTheme(page, 'light');
  await changePreference(page, 'dark');
  await expectTheme(page, 'dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expectTheme(page, 'dark');
  await changePreference(page, 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'light');
  await changePreference(page, 'glass');
  await expectTheme(page, 'dark');
});

test('unchanged Surface/Card markup resolves readable semantic colors in both themes', async ({
  page,
}, testInfo) => {
  await page.goto('/install');
  await page.waitForLoadState('networkidle');
  const markup = execFileSync(
    process.execPath,
    ['--import', 'tsx', 'tests/e2e/theme-foundation-markup.ts'],
    { encoding: 'utf8' }
  );
  // Render actual foundation HTML against the production CSS, without adding app routes.
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.style.cssText =
      'position:relative;padding:24px;max-width:640px;margin:auto;z-index:1;background:hsl(var(--surface-app))';
    host.innerHTML = html;
    document.body.prepend(host);
  }, markup);
  for (const theme of ['light', 'dark'] as const) {
    await changePreference(page, theme);
    await expectTheme(page, theme);
    // Root markers change synchronously; WebKit style invalidation and the interactive
    // Surface color transition may finish later. Verify the final palette, not an intermediate frame.
    await expect(async () => {
      const colors = await page.evaluate(() => {
        const card = getComputedStyle(document.getElementById('theme-card')!);
        const root = getComputedStyle(document.documentElement);
        const resolve = (name: string) => {
          const probe = document.createElement('span');
          probe.style.color = `hsl(${root.getPropertyValue(name)})`;
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        };
        const btnPrimary = getComputedStyle(document.getElementById('theme-btn-primary')!);
        const btnSecondary = getComputedStyle(document.getElementById('theme-btn-secondary')!);
        const inputNormal = getComputedStyle(document.getElementById('theme-input-normal')!);
        const inputInvalid = getComputedStyle(document.getElementById('theme-input-invalid')!);
        const skeleton = getComputedStyle(document.getElementById('theme-skeleton')!);
        const btnPrimaryRect = document
          .getElementById('theme-btn-primary')!
          .getBoundingClientRect();
        const iconBtnRect = document.getElementById('theme-icon-btn')!.getBoundingClientRect();
        const inputNormalRect = document
          .getElementById('theme-input-normal')!
          .getBoundingClientRect();

        return {
          background: card.backgroundColor,
          foreground: card.color,
          muted: getComputedStyle(document.querySelector('#theme-card p')!).color,
          raised: getComputedStyle(document.getElementById('theme-raised')!).backgroundColor,
          subtle: getComputedStyle(document.getElementById('theme-subtle')!).backgroundColor,
          canvas: getComputedStyle(document.body).backgroundColor,
          focus: resolve('--focus-ring'),
          danger: resolve('--status-danger'),
          primary: resolve('--action-primary'),
          onPrimary: resolve('--content-on-primary'),
          btnPrimaryBg: btnPrimary.backgroundColor,
          btnPrimaryFg: btnPrimary.color,
          btnSecondaryBg: btnSecondary.backgroundColor,
          inputBg: inputNormal.backgroundColor,
          inputFg: inputNormal.color,
          inputBorder: inputNormal.borderColor,
          inputInvalidBorder: inputInvalid.borderColor,
          skeletonBg: skeleton.backgroundColor,
          btnHeight: btnPrimaryRect.height,
          iconBtnWidth: iconBtnRect.width,
          iconBtnHeight: iconBtnRect.height,
          inputHeight: inputNormalRect.height,
          expectedActionPrimaryContent: resolve('--action-primary-content'),
          expectedControlSurface: resolve('--control-surface'),
          expectedControlContent: resolve('--control-content'),
          expectedControlBorder: resolve('--control-border'),
          expected: {
            background: resolve('--surface-card'),
            foreground: resolve('--content-primary'),
            muted: resolve('--content-muted'),
            raised: resolve('--surface-popover'),
            subtle: resolve('--surface-secondary'),
            canvas: resolve('--surface-app'),
          },
        };
      });
      for (const key of [
        'background',
        'foreground',
        'muted',
        'raised',
        'subtle',
        'canvas',
      ] as const) {
        expect(colors[key], key + ' reaches the resolved semantic token').toBe(
          colors.expected[key]
        );
      }
      expect(new Set([colors.canvas, colors.background, colors.raised, colors.subtle]).size).toBe(
        4
      );
      expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(7);
      expect(contrast(colors.muted, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.focus, colors.background)).toBeGreaterThanOrEqual(3);
      expect(contrast(colors.danger, colors.background)).toBeGreaterThanOrEqual(4.5);
      if (theme === 'light')
        expect(contrast(colors.primary, colors.onPrimary)).toBeGreaterThanOrEqual(4.5);

      // Core primitives semantic resolution & contrast
      expect(colors.btnPrimaryBg).toBe(colors.primary);
      expect(colors.btnPrimaryFg).toBe(colors.expectedActionPrimaryContent);
      expect(colors.btnSecondaryBg).toBe(colors.subtle);
      expect(colors.inputBg).toBe(colors.expectedControlSurface);
      expect(colors.inputFg).toBe(colors.expectedControlContent);
      expect(colors.inputBorder).toBe(colors.expectedControlBorder);
      expect(colors.inputInvalidBorder).toBe(colors.danger);
      expect(colors.skeletonBg).toBe(colors.subtle);

      // Primary Button text contrast must be >= 4.5 in BOTH dark and light themes
      expect(contrast(colors.btnPrimaryFg, colors.btnPrimaryBg)).toBeGreaterThanOrEqual(4.5);

      // Canonical touch target sizes (>= 44px)
      expect(colors.btnHeight).toBeGreaterThanOrEqual(44);
      expect(colors.inputHeight).toBeGreaterThanOrEqual(44);
      expect(colors.iconBtnHeight).toBeGreaterThanOrEqual(44);
      expect(colors.iconBtnWidth).toBeGreaterThanOrEqual(44);
      expect(colors.iconBtnWidth).toBe(colors.iconBtnHeight);

      await page.locator('#theme-btn-primary').focus();
      await expect(page.locator('#theme-btn-primary')).toBeFocused();
      await page.locator('#theme-input-normal').focus();
      await expect(page.locator('#theme-input-normal')).toBeFocused();

      await page.locator('#theme-focus').focus();
      await expect(page.locator('#theme-card')).toHaveCSS('border-color', colors.focus);
    }).toPass({ timeout: 15000 });
    if (['desktop-1440', 'iphone-13'].includes(testInfo.project.name)) {
      await testInfo.attach(`${theme}-foundation`, {
        body: await page
          .locator('#theme-card')
          .screenshot({ path: testInfo.outputPath(`${theme}-foundation.png`) }),
        contentType: 'image/png',
      });
    }
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'light' });
  test('server content and system palette remain available', async ({ page }) => {
    await page.goto('/install');
    await expect(page.getByRole('heading', { name: /BiwengerStats en tu móvil/i })).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 243, 241)');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(5, 5, 5)');
  });
});

test('native cross-tab changes preserve system through reload and navigation', async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/install');
  await page.waitForLoadState('networkidle');
  const writer = await context.newPage();
  // A same-origin static document writes real localStorage without running a second app.
  await writer.route('**/theme-storage-writer', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Storage writer</title>',
    })
  );
  await writer.goto('/theme-storage-writer');
  try {
    for (const [preference, resolved] of [
      ['light', 'light'],
      ['dark', 'dark'],
      ['system', 'dark'],
      ['neo', 'dark'],
    ] as const) {
      await writer.evaluate((value) => localStorage.setItem('theme', value), preference);
      await expectTheme(page, resolved);
    }
    await writer.evaluate(() => localStorage.setItem('theme', 'system'));
    await page.emulateMedia({ colorScheme: 'light' });
    await expectTheme(page, 'light');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expectTheme(page, 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
    await page.getByRole('link', { name: 'Abrir inicio de sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.waitForLoadState('networkidle');
    await expectTheme(page, 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('system');
    await writer.evaluate(() => localStorage.setItem('theme', 'dark'));
    await expectTheme(page, 'dark');
    await writer.evaluate(() => localStorage.removeItem('theme'));
    await expectTheme(page, 'light');
  } finally {
    await writer.close();
  }
});

test('blocked theme storage leaves SSR and hydrated content usable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'theme') throw new DOMException('Storage unavailable', 'SecurityError');
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'theme') throw new DOMException('Storage unavailable', 'SecurityError');
      return originalSet.call(this, key, value);
    };
  });
  await page.goto('/install');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /BiwengerStats en tu móvil/i })).toBeVisible();
  await expectTheme(page, 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
  await page.getByRole('link', { name: 'Abrir inicio de sesión' }).click();
  await expect(page.getByLabel('Manager')).toBeVisible();
  await expectTheme(page, 'dark');
});

test('real application light smoke retains content and shell navigation', async ({
  page,
}, testInfo) => {
  test.skip(
    !['desktop-1440', 'iphone-13'].includes(testInfo.project.name),
    'Representative desktop and phone smoke coverage.'
  );
  expect(process.env.E2E_USERNAME, 'Local authenticated fixture is required').toBeTruthy();
  expect(process.env.E2E_PASSWORD, 'Local authenticated fixture is required').toBeTruthy();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    if (localStorage.getItem('theme') === null) localStorage.setItem('theme', 'light');
  });
  await page.goto('/login?callbackUrl=%2Fdashboard');
  await page.getByLabel('Manager').fill(process.env.E2E_USERNAME!);
  await page.locator('#login-password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  for (const title of ['Dashboard', 'Clasificación']) {
    if (title === 'Clasificación') {
      await page
        .getByRole('link', { name: 'Clasificación', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      await expect(page).toHaveURL(/\/standings/);
    }
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expectTheme(page, 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      width: document.documentElement.scrollWidth,
      height: document.body.getBoundingClientRect().height,
      text: document.body.innerText.length,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.height).toBeGreaterThan(200);
    expect(dimensions.text).toBeGreaterThan(100);
    // Diagnostic evidence only: legacy component colors are not approved by this smoke test.
    await testInfo.attach('light-' + title, {
      body: await page.screenshot({ path: testInfo.outputPath('light-' + title + '.png') }),
      contentType: 'image/png',
    });
  }
  if (testInfo.project.name === 'iphone-13') {
    const navigation = page.getByRole('navigation', { name: 'Navegación principal móvil' });
    await navigation.getByRole('button', { name: 'Más' }).click();
    await expect(page.getByRole('dialog', { name: /Más secciones/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Más secciones/i })).toBeHidden();
    await expectTheme(page, 'light');
  }
});
