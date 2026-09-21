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

// No production selector or showcase route: exercise the supported cross-tab storage contract.
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

test('stored light is applied before hydration and survives reload/navigation', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    if (localStorage.getItem('theme') === null) localStorage.setItem('theme', 'light');
  });
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
    await expectTheme(page, 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(244, 243, 241)');
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
  await expectTheme(page, 'light');
  const reloadedSession = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/auth/session'
  );
  await page.reload();
  await (await reloadedSession).finished();
  await page.waitForLoadState('networkidle');
  await expectTheme(page, 'light');
  await page.getByRole('link', { name: 'Abrir inicio de sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.waitForLoadState('networkidle');
  await expectTheme(page, 'light');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
  if (['desktop-1440', 'iphone-13'].includes(testInfo.project.name)) {
    await testInfo.attach('light-existing-page', {
      body: await page.screenshot({ path: testInfo.outputPath('light-existing-page.png') }),
      contentType: 'image/png',
    });
  }
});

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
      };
    });
    expect(new Set([colors.canvas, colors.background, colors.raised, colors.subtle]).size).toBe(4);
    expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(colors.muted, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.focus, colors.background)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.danger, colors.background)).toBeGreaterThanOrEqual(4.5);
    if (theme === 'light')
      expect(contrast(colors.primary, colors.onPrimary)).toBeGreaterThanOrEqual(4.5);
    await page.locator('#theme-focus').focus();
    await expect(page.locator('#theme-card')).toHaveCSS('border-color', colors.focus);
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
  });
});
