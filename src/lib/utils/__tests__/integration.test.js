/**
 * Integration tests for API routes
 * Tests that API endpoints return proper responses with correct structure
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use relative imports for vitest compatibility
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateNumber, validatePlayerId } from '@/lib/utils/validation';

describe('API Response Structure', () => {
  describe('successResponse utility', () => {
    it('should create proper JSON response with data wrapped in success envelope', async () => {
      const data = { test: 'value' };
      const response = successResponse(data);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({ success: true, data: { test: 'value' } });
    });

    it('should include cache headers when maxAge is specified', async () => {
      const response = successResponse({ data: 'test' }, CACHE_DURATIONS.MEDIUM);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=300');
    });
  });

  describe('errorResponse utility', () => {
    it('should create error response with success=false envelope', async () => {
      const response = errorResponse('Something went wrong', 500);

      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json).toEqual({ success: false, error: 'Something went wrong' });
    });

    it('should default to 500 status', async () => {
      const response = errorResponse('Error');

      expect(response.status).toBe(500);
    });
  });
});

describe('Validation utilities', () => {
  describe('validateNumber', () => {
    it('should validate numeric strings', () => {
      const result = validateNumber('10', { min: 1, max: 100 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should reject invalid numbers with error', () => {
      const result = validateNumber('abc', { defaultValue: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid numeric value');
      expect(result.value).toBeUndefined(); // No value on error
    });

    it('should enforce min bounds', () => {
      const tooLow = validateNumber('0', { min: 5, defaultValue: 5 });
      expect(tooLow.valid).toBe(false);
      expect(tooLow.error).toContain('at least 5');
    });

    it('should enforce max bounds', () => {
      const tooHigh = validateNumber('100', { max: 50, defaultValue: 50 });
      expect(tooHigh.valid).toBe(false);
      expect(tooHigh.error).toContain('at most 50');
    });

    it('should use defaultValue for null/undefined', () => {
      const result = validateNumber(null, { defaultValue: 10 });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(10);
    });
  });

  describe('validatePlayerId', () => {
    it('should validate numeric player IDs', () => {
      const result = validatePlayerId('123');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(123);
    });

    it('should reject non-numeric IDs', () => {
      const result = validatePlayerId('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Cache Duration Constants', () => {
  it('should have correct cache durations', () => {
    expect(CACHE_DURATIONS.SHORT).toBe(60); // 1 minute
    expect(CACHE_DURATIONS.MEDIUM).toBe(300); // 5 minutes
    expect(CACHE_DURATIONS.LONG).toBe(900); // 15 minutes
  });
});
