/**
 * Removes legacy Biwenger credentials from an Auth.js token before it is
 * persisted or used to build a browser-visible session.
 */
export function sanitizeAuthToken(token = {}) {
  const { biwengerToken: _biwengerToken, ...safeToken } = token;
  return safeToken;
}

/**
 * Applies an authenticated user to a JWT using only browser-safe fields.
 */
export function applyUserToAuthToken(token, user) {
  const safeToken = sanitizeAuthToken(token);

  if (!user) return safeToken;

  return {
    ...safeToken,
    id: user.id,
    email: user.email,
    biwengerLinked: Boolean(user.biwengerLinked ?? user.biwengerToken),
  };
}

/**
 * Refreshes server-derived account state without accepting client-provided
 * credential or linked-state values.
 */
export function applyAccountStateToAuthToken(token, account) {
  const safeToken = sanitizeAuthToken(token);

  if (!account) return safeToken;

  return {
    ...safeToken,
    email: account.email,
    biwengerLinked: Boolean(account.biwengerToken),
  };
}

/**
 * Builds the browser-visible session from an already-sanitized token.
 */
export function createSafeBrowserSession(session, token) {
  const safeToken = sanitizeAuthToken(token);
  const safeUser = session?.user ? { ...session.user } : undefined;

  if (!safeUser) return { ...session };

  delete safeUser.biwengerToken;
  safeUser.id = safeToken.id;
  safeUser.email = safeToken.email;
  safeUser.biwengerLinked = Boolean(safeToken.biwengerLinked);

  return { ...session, user: safeUser };
}
