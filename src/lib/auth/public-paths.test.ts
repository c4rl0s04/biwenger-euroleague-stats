import { describe, expect, it } from 'vitest';
import { isPublicPath } from '@/auth.config';

describe('public PWA paths', () => {
  it.each([
    '/login',
    '/install',
    '/offline',
    '/sw.js',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/_vercel/insights/script.js',
  ])('allows %s without a session', (pathname) => {
    expect(isPublicPath(pathname)).toBe(true);
  });

  it.each(['/dashboard', '/season-review', '/player/42'])('keeps %s authenticated', (pathname) => {
    expect(isPublicPath(pathname)).toBe(false);
  });
});
