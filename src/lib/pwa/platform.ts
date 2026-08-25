export type PwaPlatform = 'ios' | 'android' | 'desktop';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function detectPwaPlatform(userAgent: string): PwaPlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export function isStandaloneDisplay(input: {
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
}): boolean {
  return input.displayModeStandalone || input.navigatorStandalone === true;
}

export function shouldShowInstallPromotion(input: {
  visits: number;
  isStandalone: boolean;
  dismissedAt: number | null;
  now?: number;
}): boolean {
  if (input.isStandalone || input.visits < 2) return false;
  if (input.dismissedAt === null) return true;
  return (input.now ?? Date.now()) - input.dismissedAt >= THIRTY_DAYS_MS;
}
