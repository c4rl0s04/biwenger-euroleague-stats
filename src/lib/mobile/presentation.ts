export type PresentationMode = 'phone' | 'desktop';

export interface PresentationDetectionInput {
  userAgent?: string | null;
  mobileHint?: string | null;
}

const IPHONE_PATTERN = /\b(iPhone|iPod)\b/i;
const WINDOWS_PHONE_PATTERN = /Windows Phone/i;
const ANDROID_PATTERN = /Android/i;
const MOBILE_PATTERN = /\bMobile\b/i;
const IPAD_PATTERN = /\biPad\b/i;
const IPAD_DESKTOP_PATTERN = /Macintosh/i;

export function detectPresentationMode({
  userAgent = '',
  mobileHint = null,
}: PresentationDetectionInput): PresentationMode {
  const agent = userAgent ?? '';
  if (WINDOWS_PHONE_PATTERN.test(agent)) return 'phone';

  const isIpad =
    IPAD_PATTERN.test(agent) ||
    (IPAD_DESKTOP_PATTERN.test(agent) && MOBILE_PATTERN.test(agent) && !IPHONE_PATTERN.test(agent));
  const isAndroidTablet = ANDROID_PATTERN.test(agent) && !MOBILE_PATTERN.test(agent);

  if (isIpad || isAndroidTablet) return 'desktop';

  if (
    IPHONE_PATTERN.test(agent) ||
    (ANDROID_PATTERN.test(agent) && MOBILE_PATTERN.test(agent))
  ) {
    return 'phone';
  }

  return mobileHint === '?1' ? 'phone' : 'desktop';
}
