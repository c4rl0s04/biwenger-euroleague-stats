import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('published service worker', () => {
  const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

  it('preloads only the public shell and falls back offline for navigation', () => {
    expect(source).toContain("const OFFLINE_URL = '/offline'");
    expect(source).toContain("'/icons/icon-192.png'");
    expect(source).toContain("request.mode === 'navigate'");
    expect(source).toContain('caches.match(OFFLINE_URL)');
  });

  it('does not persist authenticated navigation or API responses', () => {
    expect(source).not.toMatch(/cache\.put\(request/);
    expect(source).not.toMatch(/cache\.add\(fetch\(/);
  });

  it('only removes obsolete caches owned by this application', () => {
    expect(source).toContain("key.startsWith('biwengerstats-shell-')");
  });
});
