/**
 * Date Utilities
 * Handles timezone corrections and standardized formatting for the application.
 *
 * PROBLEM: The database stores match dates 1 hour earlier than reality (e.g., 16:45 UTC for a match at 17:45 UTC).
 * This appears to be a systematic error in the data source or ingestion process.
 *
 * SOLUTION: We manually apply a +1 hour correction to the database time.
 * This ensures that when formatted with 'Europe/Madrid' timezone, it displays the correct local time.
 */

// 1 Hour in milliseconds
const TIMEZONE_OFFSET_MS = 3600 * 1000;

/**
 * Returns a Date object corrected for the database's 1-hour lag.
 * Use this INSTEAD of new Date(match.date) whenever converting DB data for display.
 *
 * @param {string|Date} dateInput - The raw date from the database
 * @returns {Date} Corrected Date object (+1 Hour)
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
