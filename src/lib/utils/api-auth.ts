import { auth } from '@/auth';
import { validateUserId } from './validation';

/**
 * Gets the userId from the request, either from query params or from the authenticated session.
 * @param request The incoming NextRequest
 * @returns The userId if valid, otherwise an error object
 */
export async function getRequestUserId(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get('userId');

  console.log(`[API-AUTH] Checking userId. Query: "${queryId}"`);

  // If query ID is present and valid, use it
  if (queryId && queryId !== 'undefined' && queryId !== 'null' && queryId !== '') {
    console.log(`[API-AUTH] Using Query ID: ${queryId}`);
    return { valid: true, value: queryId };
  }

  // Fallback to session
  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (sessionUserId) {
    console.log(`[API-AUTH] Using Session ID: ${sessionUserId}`);
    return { valid: true, value: sessionUserId };
  }

  console.log(`[API-AUTH] FAILED: No ID found in query or session. Session exists? ${!!session}`);
  return { valid: false, error: 'User ID required (missing or unauthenticated)' };
}
