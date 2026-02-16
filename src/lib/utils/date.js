/**
 * Date Utilities
 * Handles timezone corrections and standardized formatting for the application.
 *
 * PROBLEM: The database stores match dates as 'timestamp without time zone'.
 * Localhost (CET) parses "18:00" as 17:00 UTC.
 * Server (UTC) parses "18:00" as 18:00 UTC.
 *
 * SOLUTION: Force interpretation as UTC everywhere.
 * DB "18:00" -> Always treated as "18:00 UTC".
 * This matches the real event time (e.g. Zalgiris 19:00 CET = 18:00 UTC).
 */

/**
 * Returns a Date object from the database inputs.
 * Forces the DB string to be treated as UTC regardless of server timezone.
 *
 * @param {string|Date} dateInput - The raw date from the database
 * @returns {Date} Date object (UTC-normalized)
 */
export function getCorrectedMatchDate(dateInput) {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  // Force UTC Interpretation
  // When DB is "timestamp without time zone", 'pg' driver uses local system time.
  // By using local getters and feeding them into Date.UTC, we normalize this.
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  );
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
