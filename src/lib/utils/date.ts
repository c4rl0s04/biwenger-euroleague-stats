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
 * Returns a Date object.
 * Simple wrapper now that Drizzle handles UTC correctly.
 * Kept for backward compatibility during refactor.
 */
export function getCorrectedMatchDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  return new Date(dateInput);
}

/**
 * Formats a match date into a standard Time string (e.g., "17:00")
 * Uses 'Europe/Madrid' timezone.
 */
export function formatMatchTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);

  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
}

/**
 * Formats a match date into a full string (e.g., "Martes 3 de Febrero, 17:00")
 */
export function formatMatchDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Madrid',
  });
}
