/**
 * API Validation Utilities
 * Centralized validation functions for API routes
 */

export type ValidationResult<T> =
  | { valid: true; value: T; error?: never }
  | { valid: false; value?: never; error: string };

interface NumberValidationOptions {
  defaultValue?: number;
  min?: number;
  max?: number;
}

/**
 * Validates and parses a numeric parameter
 */
export function validateNumber(
  value: string | null | undefined,
  options: NumberValidationOptions = {}
): ValidationResult<number> {
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
 */
export function validateRequiredString(
  value: string | null | undefined,
  paramName: string = 'parameter'
): ValidationResult<string> {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { valid: false, error: `${paramName} is required` };
  }
  return { valid: true, value: value.trim() };
}

/**
 * Validates a player ID (positive integer)
 */
export function validatePlayerId(id: string | number | null | undefined): ValidationResult<number> {
  const parsed = parseInt(String(id), 10);

  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid player ID' };
  }

  return { valid: true, value: parsed };
}

/**
 * Validates a user ID (positive integer)
 */
export function validateUserId(id: string | number | null | undefined): ValidationResult<string | number> {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'User ID is required' };
  }

  const parsed = parseInt(String(id), 10);

  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, error: 'Invalid user ID format' };
  }

  return { valid: true, value: id };
}
