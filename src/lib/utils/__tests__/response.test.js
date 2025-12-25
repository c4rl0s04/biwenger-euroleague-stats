import { describe, it, expect, vi } from 'vitest';
import { cachedResponse, successResponse, errorResponse, CACHE_DURATIONS } from '../response.js';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({
      data,
      status: options?.status || 200,
      headers: options?.headers || {},
    })),
  },
}));

describe('CACHE_DURATIONS', () => {
  it('should have all expected duration constants', () => {
    expect(CACHE_DURATIONS.SHORT).toBe(60);
    expect(CACHE_DURATIONS.MEDIUM).toBe(300);
    expect(CACHE_DURATIONS.LONG).toBe(900);
    expect(CACHE_DURATIONS.STALE).toBe(60);
  });
});

describe('cachedResponse', () => {
  it('should return response with Cache-Control headers', () => {
    const result = cachedResponse({ test: 'data' });
    expect(result.headers['Cache-Control']).toContain('max-age=300');
    expect(result.headers['Cache-Control']).toContain('stale-while-revalidate=60');
  });

  it('should use custom maxAge', () => {
    const result = cachedResponse({ test: 'data' }, { maxAge: 600 });
    expect(result.headers['Cache-Control']).toContain('max-age=600');
  });

  it('should set custom status', () => {
    const result = cachedResponse({ test: 'data' }, { status: 201 });
    expect(result.status).toBe(201);
  });
});

describe('successResponse', () => {
  it('should wrap data in success format', () => {
    const result = successResponse({ foo: 'bar' });
    expect(result.data.success).toBe(true);
    expect(result.data.data.foo).toBe('bar');
  });

  it('should use MEDIUM cache duration by default', () => {
    const result = successResponse({ foo: 'bar' });
    expect(result.headers['Cache-Control']).toContain('max-age=300');
  });

  it('should accept custom cache duration', () => {
    const result = successResponse({ foo: 'bar' }, CACHE_DURATIONS.LONG);
    expect(result.headers['Cache-Control']).toContain('max-age=900');
  });
});

describe('errorResponse', () => {
  it('should wrap message in error format', () => {
    const result = errorResponse('Something went wrong');
    expect(result.data.success).toBe(false);
    expect(result.data.error).toBe('Something went wrong');
  });

  it('should default to 500 status', () => {
    const result = errorResponse('Error');
    expect(result.status).toBe(500);
  });

  it('should accept custom status code', () => {
    const result = errorResponse('Not found', 404);
    expect(result.status).toBe(404);
  });
});
