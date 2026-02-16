/**
 * Date Utilities
 * Handles timezone corrections and standardized formatting for the application.
 *
 * PROBLEM: The database stores match dates 1 hour earlier than reality (e.g., 16:45 UTC for a match at 17:45 UTC).
 * This appears to be a systematic error in the data source or ingestion process.
 *
 * SOLUTION: We manually apply a +1 hour correction to the database time.
 * IMPORTANT: valid for both Localhost (CET) and Vercel (UTC) by forcing UTC interpretation.
 */

// 1 Hour in milliseconds
const TIMEZONE_OFFSET_MS = 3600 * 1000;

/**
 * Returns a Date object corrected for the database's 1-hour lag.
 * Forces the DB string to be treated as UTC regardless of server timezone.
 *
 * @param {string|Date} dateInput - The raw date from the database
 * @returns {Date} Corrected Date object (+1 Hour)
 */
export function getCorrectedMatchDate(dateInput) {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  // 1. Force UTC Interpretation
  // When DB is "timestamp without time zone", 'pg' driver uses local system time.
  // - Localhost (CET): "16:45" -> 16:45 CET (15:45 UTC) -> getHours() = 16
  // - Vercel (UTC): "16:45" -> 16:45 UTC -> getHours() = 16
  // By using local getters (getHours, etc.) and feeding them into Date.UTC,
  // we "hoist" the time to be UTC in both environments.
  const intendedUTC = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );

  // 2. Apply Data Correction (+1 Hour)
  return new Date(intendedUTC + TIMEZONE_OFFSET_MS);
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
