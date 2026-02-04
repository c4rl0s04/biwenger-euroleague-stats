/**
 * Date Utilities
 * Handles timezone corrections and standardized formatting for the application.
 *
 * PROBLEM: The database stores match dates 1 hour earlier than reality (e.g., 15:00 UTC instead of 16:00 UTC).
 * SOLUTION: We apply a global +1 hour offset to all match dates before display or logic.
 */

// 1 Hour in milliseconds
const TIMEZONE_OFFSET_MS = 3600 * 1000;

/**
 * Returns a Date object corrected for the database's 1-hour lag.
 * Use this INSTEAD of new Date(match.date) whenever converting DB data for display.
 *
 * @param {string|Date} dateInput - The raw date from the database (e.g. "2026-02-03T15:00:00.000Z")
 * @returns {Date} Corrected Date object (e.g. represents 16:00 UTC)
 */
export function getCorrectedMatchDate(dateInput) {
  if (!dateInput) return null;
  const originalDate = new Date(dateInput);
  return new Date(originalDate.getTime() + TIMEZONE_OFFSET_MS);
}

/**
 * Formats a match date into a standard Time string (e.g., "17:00")
 * Uses 'Europe/Madrid' timezone.
 *
 * @param {string|Date} dateInput
 * @returns {string} Formatted time string
 */
export function formatMatchTime(dateInput) {
  const date = getCorrectedMatchDate(dateInput);
  if (!date) return '';

  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
}

/**
 * Formats a match date into a full string (e.g., "Martes 3 de Febrero, 17:00")
 *
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatMatchDate(dateInput) {
  const date = getCorrectedMatchDate(dateInput);
  if (!date) return '';

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
}
