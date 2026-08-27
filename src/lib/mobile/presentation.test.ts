import { describe, expect, it } from 'vitest';

import { detectPresentationMode } from './presentation';

describe('detectPresentationMode', () => {
  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', null],
    ['iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 17_5 like Mac OS X)', null],
    [
      'Android phone',
      'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 Mobile Safari/537.36',
      '?1',
    ],
    [
      'Windows Phone',
      'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950)',
      '?1',
    ],
  ])('uses the phone presentation for %s', (_label, userAgent, mobileHint) => {
    expect(detectPresentationMode({ userAgent, mobileHint })).toBe('phone');
  });

  it.each([
    ['desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '?0'],
    [
      'iPad',
      'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      '?1',
    ],
    [
      'iPad desktop user agent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      '?1',
    ],
    [
      'Android tablet',
      'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Safari/537.36',
      '?0',
    ],
  ])('keeps the desktop presentation for %s', (_label, userAgent, mobileHint) => {
    expect(detectPresentationMode({ userAgent, mobileHint })).toBe('desktop');
  });

  it('uses an explicit mobile client hint for an otherwise unknown handset', () => {
    expect(detectPresentationMode({ userAgent: 'Unknown handset', mobileHint: '?1' })).toBe(
      'phone'
    );
  });

  it('does not infer presentation from viewport orientation', () => {
    const landscapeIphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';

    expect(detectPresentationMode({ userAgent: landscapeIphone, mobileHint: '?1' })).toBe('phone');
  });
});
