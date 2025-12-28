/**
 * API Validation Utilities
 * Centralized validation functions for API routes
 */

/**
 * Validates and parses a numeric parameter
 * @param {string|null} value - Raw parameter value
 * @param {object} options - Validation options
 * @param {number} options.defaultValue - Default if value is null/undefined
 * @param {number} options.min - Minimum allowed value
 * @param {number} options.max - Maximum allowed value
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateNumber(value, options = {}) {
  const { defaultValue = 0, min = 0, max = 1000 } = options;

  if (value === null || value === undefined || value === '') {
    return { valid: true, value: defaultValue };
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    return { valid: false, error: 'Invalid numeric value' };
  }

  if (parsed < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (parsed > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }

  return { valid: true, value: parsed };
}

/**
 * Validates a required string parameter
 * @param {string|null} value - Raw parameter value
 * @param {string} paramName - Parameter name for error message
 * @returns {{ valid: boolean, value?: string, error?: string }}
 */
export function validateRequiredString(value, paramName = 'parameter') {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { valid: false, error: `${paramName} is required` };
  }
  return { valid: true, value: value.trim() };
}

/**
 * Validates a player ID (positive integer)
 * @param {string|number} id - Player ID
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validatePlayerId(id) {
  const parsed = parseInt(id, 10);

  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid player ID' };
  }

  return { valid: true, value: parsed };
}

/**
 * Validates a user ID (positive integer)
 * @param {string|number|null} id - User ID
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateUserId(id) {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'User ID is required' };
  }

  const parsed = parseInt(id, 10);

  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid user ID format' };
  }

  return { valid: true, value: id };
}
