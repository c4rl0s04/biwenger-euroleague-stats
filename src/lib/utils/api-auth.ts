import { auth } from '@/auth';
import { validateUserId } from './validation';

export type AuthResult = { valid: true; value: string } | { valid: false; error: string };

/**
 * Gets the userId from the request, either from query params or from the authenticated session.
 * @param request The incoming NextRequest
 * @returns The userId if valid, otherwise an error object
 */
export async function getRequestUserId(request: Request): Promise<AuthResult> {
  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get('userId');

  console.log(`[API-AUTH] Checking userId. Query: "${queryId}"`);

  // If query ID is present, validate and use it
  if (queryId && queryId !== 'undefined' && queryId !== 'null' && queryId !== '') {
    const validation = validateUserId(queryId);
    if (validation.valid) {
      console.log(`[API-AUTH] Using Valid Query ID: ${queryId}`);
      return { valid: true, value: String(queryId) };
    } else {
      console.log(`[API-AUTH] Invalid Query ID: ${queryId} - ${validation.error}`);
      return { valid: false, error: validation.error };
    }
  }

  // Fallback to session
  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (sessionUserId) {
    const validation = validateUserId(sessionUserId);
    if (validation.valid) {
      console.log(`[API-AUTH] Using Valid Session ID: ${sessionUserId}`);
      return { valid: true, value: String(sessionUserId) };
    } else {
      console.log(`[API-AUTH] Invalid Session ID: ${sessionUserId} - ${validation.error}`);
      return { valid: false, error: validation.error };
    }
  }

  console.log(`[API-AUTH] FAILED: No ID found in query or session. Session exists? ${!!session}`);
  return { valid: false, error: 'User ID required (missing or unauthenticated)' };
}
