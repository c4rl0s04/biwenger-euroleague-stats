import { vi } from 'vitest';

// Global mock for NextAuth to prevent "next/server" import errors in tests
vi.mock('@/auth', () => ({
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Next.js headers/cookies which are often used with NextAuth
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => new Map()),
}));
