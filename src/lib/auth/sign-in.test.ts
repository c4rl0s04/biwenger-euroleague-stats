import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getCsrfToken, getSession } from 'next-auth/react';
import { signInWithCredentials } from './sign-in';

vi.mock('next-auth/react', () => ({ getCsrfToken: vi.fn(), getSession: vi.fn() }));

const send = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCsrfToken).mockResolvedValue('fixture-csrf');
  vi.stubGlobal('fetch', send);
});
afterEach(() => vi.unstubAllGlobals());

it('handles a firewall response before attempting to parse JSON', async () => {
  send.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));
  await expect(signInWithCredentials('fixture', 'fixture-password', '/dashboard')).resolves.toBe(
    'rate-limited'
  );
  expect(getSession).not.toHaveBeenCalled();
});

it('keeps CSRF validation and refreshes the session after successful sign-in', async () => {
  send.mockResolvedValueOnce(Response.json({ url: 'https://app.example.test/dashboard' }));
  await expect(signInWithCredentials('fixture', 'fixture-password', '/dashboard')).resolves.toBe(
    'signed-in'
  );
  expect(send).toHaveBeenCalledExactlyOnceWith('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'X-Auth-Return-Redirect': '1' },
    body: new URLSearchParams({
      name: 'fixture',
      password: 'fixture-password',
      csrfToken: 'fixture-csrf',
      callbackUrl: '/dashboard',
    }),
  });
  expect(getSession).toHaveBeenCalledOnce();
});

it('keeps invalid credentials distinct from rate limiting and infrastructure errors', async () => {
  send.mockResolvedValueOnce(
    Response.json({ url: 'https://app.example.test/login?error=CredentialsSignin' })
  );
  await expect(signInWithCredentials('fixture', 'wrong', '/dashboard')).resolves.toBe(
    'invalid-credentials'
  );
  send.mockResolvedValueOnce(new Response(null, { status: 503 }));
  await expect(signInWithCredentials('fixture', 'wrong', '/dashboard')).rejects.toThrow();
  expect(getSession).not.toHaveBeenCalled();
});
