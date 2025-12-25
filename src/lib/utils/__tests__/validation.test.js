import { describe, it, expect } from 'vitest';
import { validateNumber, validateRequiredString, validatePlayerId } from '../validation.js';

describe('validateNumber', () => {
  it('should return default value when input is undefined', () => {
    const result = validateNumber(undefined, { defaultValue: 50 });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(50);
  });

  it('should return default value when input is null', () => {
    const result = validateNumber(null, { defaultValue: 100 });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(100);
  });

  it('should parse valid integer string', () => {
    const result = validateNumber('42', { defaultValue: 10 });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(42);
  });

  it('should return error for non-numeric string', () => {
    const result = validateNumber('abc', { defaultValue: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid numeric');
  });

  it('should enforce minimum value', () => {
    const result = validateNumber('5', { defaultValue: 10, min: 10 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least');
  });

  it('should enforce maximum value', () => {
    const result = validateNumber('100', { defaultValue: 10, max: 50 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
  });

  it('should accept value within range', () => {
    const result = validateNumber('25', { defaultValue: 10, min: 1, max: 50 });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(25);
  });

  it('should return default when empty string', () => {
    const result = validateNumber('', { defaultValue: 10 });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(10);
  });
});

describe('validateRequiredString', () => {
  it('should return error for undefined value', () => {
    const result = validateRequiredString(undefined, 'userId');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('userId');
  });

  it('should return error for null value', () => {
    const result = validateRequiredString(null, 'playerId');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('playerId');
  });

  it('should return error for empty string', () => {
    const result = validateRequiredString('', 'name');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('name');
  });

  it('should return valid for non-empty string', () => {
    const result = validateRequiredString('test123', 'id');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('test123');
  });

  it('should trim whitespace and reject whitespace-only', () => {
    const result = validateRequiredString('   ', 'field');
    expect(result.valid).toBe(false);
  });
});

describe('validatePlayerId', () => {
  it('should return error for undefined', () => {
    const result = validatePlayerId(undefined);
    expect(result.valid).toBe(false);
  });

  it('should return error for non-numeric string', () => {
    const result = validatePlayerId('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid player ID');
  });

  it('should return error for negative number', () => {
    const result = validatePlayerId('-5');
    expect(result.valid).toBe(false);
  });

  it('should return error for zero', () => {
    const result = validatePlayerId('0');
    expect(result.valid).toBe(false);
  });

  it('should return valid for positive integer string', () => {
    const result = validatePlayerId('123');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(123);
  });

  it('should return valid for numeric value', () => {
    const result = validatePlayerId(456);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(456);
  });
});
