import { getCsrfToken, getSession } from 'next-auth/react';

type SignInResult = 'signed-in' | 'invalid-credentials' | 'rate-limited';

export async function signInWithCredentials(
  name: string,
  password: string,
  callbackUrl: string
): Promise<SignInResult> {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) throw new Error('Unable to initialize sign-in');

  // Auth.js's client parses JSON before exposing the status, but the firewall can send text.
  const response = await fetch('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'X-Auth-Return-Redirect': '1' },
    body: new URLSearchParams({ name, password, csrfToken, callbackUrl }),
  });
  if (response.status === 429) return 'rate-limited';
  if (!response.ok) throw new Error('Unable to complete sign-in');

  const { url } = await response.json();
  const error = new URL(url).searchParams.get('error');
  if (error === 'CredentialsSignin') return 'invalid-credentials';
  if (error) throw new Error('Unable to complete sign-in');

  await getSession();
  return 'signed-in';
}
