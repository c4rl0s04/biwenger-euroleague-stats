import type { ComparisonManager } from '@/features/managers/public';

/** Compatibility: URL IDs are compared as whole strings, never parseInt-coerced. */
export function findCompareManager(users: ComparisonManager[], id: string | number | undefined) {
  return users.find((user) => String(user.id) === String(id));
}
/** Desktop deliberately retains strict equality and first-directory-entry fallback. */
export function selectDesktopManager(users: ComparisonManager[], id?: string | number) {
  return users.find((user) => user.id === id) || users[0];
}
