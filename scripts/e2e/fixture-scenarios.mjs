/** Select a fixed repository-owned fixture, never an arbitrary seed script or environment. */
export function parseFixtureArgs(args) {
  const selectors = args.filter((arg) => arg.startsWith('--fixture='));
  if (selectors.length > 1 || args.includes('--fixture')) {
    throw new Error('Use one --fixture=default or --fixture=market selector.');
  }
  const fixture = selectors.length ? selectors[0].slice('--fixture='.length) : 'default';
  if (!['default', 'market'].includes(fixture)) throw new Error('Unknown disposable fixture.');
  return { fixture, playwrightArgs: args.filter((arg) => !arg.startsWith('--fixture=')) };
}
