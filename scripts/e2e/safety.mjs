// Fixture commands never accept the application's DATABASE_URL or load dotenv files.
export function assertFixtureTarget(connectionString, env) {
  const url = new URL(connectionString);
  if (
    env.BIWENGER_E2E_DISPOSABLE !== 'true' ||
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !/^\/biwenger_e2e_[a-z0-9_]+$/.test(url.pathname) ||
    url.search ||
    url.hash ||
    !url.port
  ) {
    throw new Error(
      'E2E fixtures require an explicitly disposable loopback database with a biwenger_e2e_ name and explicit port.'
    );
  }
  return url;
}
