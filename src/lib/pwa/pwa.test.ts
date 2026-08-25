import { describe, expect, it } from 'vitest';
import { detectPwaPlatform, isStandaloneDisplay, shouldShowInstallPromotion } from './platform';

describe('PWA platform contract', () => {
  it('distinguishes iOS, Android and desktop user agents', () => {
    expect(
      detectPwaPlatform(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'
      )
    ).toBe('ios');
    expect(
      detectPwaPlatform(
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36'
      )
    ).toBe('android');
    expect(detectPwaPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('desktop');
  });

  it('recognizes both standards and iOS standalone modes', () => {
    expect(isStandaloneDisplay({ displayModeStandalone: true, navigatorStandalone: false })).toBe(
      true
    );
    expect(isStandaloneDisplay({ displayModeStandalone: false, navigatorStandalone: true })).toBe(
      true
    );
    expect(isStandaloneDisplay({ displayModeStandalone: false, navigatorStandalone: false })).toBe(
      false
    );
  });

  it('promotes installation after the second visit and respects a 30-day dismissal', () => {
    const now = new Date('2026-08-25T12:00:00.000Z').getTime();

    expect(
      shouldShowInstallPromotion({ visits: 1, isStandalone: false, dismissedAt: null, now })
    ).toBe(false);
    expect(
      shouldShowInstallPromotion({ visits: 2, isStandalone: false, dismissedAt: null, now })
    ).toBe(true);
    expect(
      shouldShowInstallPromotion({
        visits: 9,
        isStandalone: false,
        dismissedAt: now - 29 * 24 * 60 * 60 * 1000,
        now,
      })
    ).toBe(false);
    expect(
      shouldShowInstallPromotion({
        visits: 9,
        isStandalone: false,
        dismissedAt: now - 31 * 24 * 60 * 60 * 1000,
        now,
      })
    ).toBe(true);
  });
});
