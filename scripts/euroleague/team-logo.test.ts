import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { teamLogoUrl, portraitUrl } from './types';
import { validateImage } from './validate';

const base = 'https://media-cdn.incrowdsports.com/logo.png';
afterEach(() => vi.unstubAllGlobals());

describe('team logo originals', () => {
  it('removes thumbnail transforms while preserving crop and other parameters', () => {
    const url = new URL(
      teamLogoUrl(
        `${base}?crop=512:512:nowe:0:0&width=48&height=48&resizeType=fill&format=webp&v=2`
      )
    );
    expect(url.searchParams.get('crop')).toBe('512:512:nowe:0:0');
    expect(url.searchParams.get('v')).toBe('2');
    for (const key of ['width', 'height', 'resizeType', 'format'])
      expect(url.searchParams.has(key)).toBe(false);
    expect(teamLogoUrl(base)).toBe(base);
  });
  it('preserves SVG paths and rejects unapproved hosts', () => {
    expect(teamLogoUrl(base.replace('.png', '.svg') + '?width=48')).toBe(
      base.replace('.png', '.svg')
    );
    expect(() => teamLogoUrl('https://example.com/logo.png')).toThrow();
  });
  it('does not change player portrait selection', () => {
    expect(
      portraitUrl('Player', [{ alt: 'Player', source: `${base}?width=48 1x, ${base}?width=96 2x` }])
    ).toBe(`${base}?width=48`);
  });
  it('rejects thumbnail rasters for teams while preserving player validation', async () => {
    const buffer = await sharp({
      create: { width: 48, height: 48, channels: 4, background: '#fff' },
    })
      .png()
      .toBuffer();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(buffer, { headers: { 'content-type': 'image/png' } }))
    );
    await expect(validateImage(base, 'team')).rejects.toThrow('128x128');
    await expect(validateImage(base)).resolves.toEqual({ width: 48, height: 48 });
  });
  it('accepts sufficiently large rasters', async () => {
    const buffer = await sharp({
      create: { width: 244, height: 244, channels: 4, background: '#fff' },
    })
      .png()
      .toBuffer();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(buffer, { headers: { 'content-type': 'image/png' } }))
    );
    await expect(validateImage(base, 'team')).resolves.toEqual({ width: 244, height: 244 });
  });
  it('accepts scalable SVGs without imposing a raster resolution', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48"/></svg>',
            { headers: { 'content-type': 'image/svg+xml' } }
          )
      )
    );
    await expect(validateImage(base.replace('.png', '.svg'), 'team')).resolves.toEqual({
      width: 48,
      height: 48,
    });
  });
  it('rejects failed downloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 }))
    );
    await expect(validateImage(base, 'team')).rejects.toThrow('404');
  });
});
