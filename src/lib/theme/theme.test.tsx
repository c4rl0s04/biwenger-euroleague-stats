import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Card, CardTitle, Surface } from '@/components/ui/foundation';
import { createThemeStore } from './browser-store';
import {
  parseThemePreference,
  resolveTheme,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_COLORS,
} from './preferences';

function browser(stored: string | null, dark = false, unavailable = false) {
  const values = new Map<string, string>();
  if (stored !== null) values.set('theme', stored);
  const classes = new Set(['unrelated']);
  const root = {
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
    classList: {
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      add: (name: string) => classes.add(name),
    },
  };
  const metas = [{ setAttribute: vi.fn() }, { setAttribute: vi.fn() }];
  const chrome = { id: '', setAttribute: vi.fn() };
  let hasChrome = false;
  const prepend = vi.fn(() => {
    hasChrome = true;
  });
  const mediaListeners = new Set<() => void>();
  const storageListeners = new Set<(event: { key: string | null }) => void>();
  const media = {
    matches: dark,
    addEventListener: (_: string, fn: () => void) => mediaListeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => mediaListeners.delete(fn),
  };
  const target = {
    document: {
      documentElement: root,
      querySelectorAll: () => metas,
      getElementById: () => (hasChrome ? chrome : null),
      createElement: () => chrome,
      head: { prepend },
    },
    localStorage: {
      getItem: (key: string) => {
        if (unavailable) throw new Error('Denied');
        return values.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (unavailable) throw new Error('Denied');
        values.set(key, value);
      },
    },
    matchMedia: () => media,
    addEventListener: (_: string, fn: (event: { key: string | null }) => void) =>
      storageListeners.add(fn),
    removeEventListener: (_: string, fn: (event: { key: string | null }) => void) =>
      storageListeners.delete(fn),
  };
  return {
    target,
    window: target as unknown as Window,
    values,
    root,
    classes,
    metas,
    chrome,
    prepend,
    mediaListeners,
    storageListeners,
    changeOS: (dark: boolean) => {
      media.matches = dark;
      mediaListeners.forEach((fn) => fn());
    },
    changeStorage: (value: string) => {
      values.set('theme', value);
      storageListeners.forEach((fn) => fn({ key: 'theme' }));
    },
  };
}

const matrix = [
  ['system', true, 'dark'],
  ['system', false, 'light'],
  ['dark', true, 'dark'],
  ['dark', false, 'dark'],
  ['light', true, 'light'],
  ['light', false, 'light'],
] as const;

describe('application theme preference', () => {
  it.each(matrix)(
    '%s with OS dark=%s resolves %s before paint and after hydration',
    (theme, dark, resolved) => {
      expect(resolveTheme(theme, dark)).toBe(resolved);
      const client = browser(theme, dark);
      runInNewContext(THEME_BOOTSTRAP_SCRIPT, client.target);
      expect(client.root.dataset.theme).toBe(resolved);
      expect(client.root.style.colorScheme).toBe(resolved);
      const store = createThemeStore(client.window);
      const stop = store.subscribe(vi.fn());
      expect(store.getSnapshot()).toEqual({ theme, resolvedTheme: resolved });
      expect(Array.from(client.classes).sort()).toEqual([resolved, 'unrelated'].sort());
      expect(client.chrome.setAttribute).toHaveBeenLastCalledWith(
        'content',
        THEME_COLORS[resolved]
      );
      expect(client.prepend).toHaveBeenCalledTimes(1);
      client.metas.forEach((meta) => expect(meta.setAttribute).not.toHaveBeenCalled());
      stop();
    }
  );

  it.each([null, '', 'glass', 'neo', 'DARK', '<script>'])(
    'invalid historical value %s defaults to system',
    (value) => {
      const client = browser(value, true);
      expect(parseThemePreference(value)).toBe('system');
      runInNewContext(THEME_BOOTSTRAP_SCRIPT, client.target);
      expect(client.root.dataset.theme).toBe('dark');
      expect(createThemeStore(client.window).getSnapshot()).toEqual({
        theme: 'system',
        resolvedTheme: 'dark',
      });
    }
  );

  it('persists preferences, follows the OS only in system, and detaches listeners', () => {
    const client = browser(null, true);
    const store = createThemeStore(client.window);
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    client.changeOS(false);
    expect(store.getSnapshot()).toEqual({ theme: 'system', resolvedTheme: 'light' });
    store.setTheme('dark');
    expect(client.values.get('theme')).toBe('dark');
    client.changeOS(true);
    client.changeOS(false);
    expect(store.getSnapshot().resolvedTheme).toBe('dark');
    store.setTheme('light');
    client.changeOS(true);
    expect(client.values.get('theme')).toBe('light');
    expect(store.getSnapshot().resolvedTheme).toBe('light');
    store.setTheme('system');
    expect(client.values.get('theme')).toBe('system');
    expect(store.getSnapshot().resolvedTheme).toBe('dark');
    expect(createThemeStore(client.window).getSnapshot().theme).toBe('system');
    stop();
    expect(client.mediaListeners.size).toBe(0);
    expect(client.storageListeners.size).toBe(0);
    expect(listener).toHaveBeenCalled();
  });

  it('reconciles OS changes during hydration and supports subscription remounts', () => {
    const client = browser('system', true);
    const store = createThemeStore(client.window);
    client.changeOS(false);
    const stop = store.subscribe(vi.fn());
    expect(client.root.dataset.theme).toBe('light');
    stop();
    client.changeOS(true);
    const stopAgain = store.subscribe(vi.fn());
    expect(client.root.dataset.theme).toBe('dark');
    stopAgain();
  });

  it('updates from another tab and safely handles invalid storage changes', () => {
    const client = browser('dark');
    const store = createThemeStore(client.window);
    const stop = store.subscribe(vi.fn());
    client.changeStorage('light');
    expect(store.getSnapshot().theme).toBe('light');
    client.changeStorage('glass');
    expect(store.getSnapshot()).toEqual({ theme: 'system', resolvedTheme: 'light' });
    stop();
  });

  it('works without localStorage access, including the early resolver', () => {
    const client = browser(null, true, true);
    runInNewContext(THEME_BOOTSTRAP_SCRIPT, client.target);
    expect(client.root.dataset.theme).toBe('dark');
    const store = createThemeStore(client.window);
    const stop = store.subscribe(vi.fn());
    store.setTheme('light');
    expect(client.root.dataset.theme).toBe('light');
    stop();
  });

  it('renders children and deterministic context on the server without browser globals', () => {
    function Content() {
      const { theme, resolvedTheme, showSnow } = useTheme();
      return (
        <p>
          {theme}/{resolvedTheme}/{String(showSnow)}
        </p>
      );
    }
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <main>
          <Content />
          <Card>
            <CardTitle>Available before hydration</CardTitle>
            <Surface />
          </Card>
        </main>
      </ThemeProvider>
    );
    expect(html).toContain('<main>');
    expect(html).toContain('system/light/false');
    expect(html).toContain('Available before hydration');
    expect(html).toContain('var(--surface-card)');
    expect(html).not.toMatch(/dark:|light:|data-theme/);
  });

  it('keeps the no-JS light mapping identical to the explicit mapping', () => {
    const css = readFileSync(
      new URL('../../styles/tokens/semantic-tokens.css', import.meta.url),
      'utf8'
    );
    const explicit = css.split(":root[data-theme='light'] {")[1].split('}')[0];
    const fallback = css.split(':root:not([data-theme]) {')[1].split('}')[0];
    expect(fallback.replace(/\s+/g, ' ')).toBe(explicit.replace(/\s+/g, ' '));
    const dark = css.split('/* Explicit choices')[0];
    const roles = Array.from(
      dark.matchAll(
        /(--(?:surface|content|action|status|border|control|focus|effect|shell)-[\w-]+):/g
      )
    ).map((m) => m[1]);
    for (const role of roles) expect(explicit).toContain(`${role}:`);
    expect(explicit).not.toContain('--radius-surface');
    expect(explicit).not.toContain('--radius-control');
  });
});
