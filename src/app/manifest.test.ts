import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('web app manifest contract', () => {
  it('describes an installable standalone application', () => {
    const value = manifest();

    expect(value).toMatchObject({
      name: 'Biwenger Stats',
      short_name: 'BiwengerStats',
      id: '/',
      scope: '/',
      start_url: '/?source=pwa',
      display: 'standalone',
      lang: 'es',
    });
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ])
    );
  });
});
