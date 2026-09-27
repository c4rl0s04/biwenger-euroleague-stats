// Reviewed shared infrastructure, not per-route persistence exemptions.
// Exact dependency sets prevent helpers or new imports from hiding SQL behind a contract.
export const securityDependencies = {
  'src/auth.js': [
    'server-only',
    'next-auth',
    'next-auth/providers/credentials',
    'bcryptjs',
    'src/auth.config.js',
    'src/lib/auth/session-safety.js',
    'src/lib/auth/repository.ts',
    'src/lib/credentials/server.ts',
  ],
  'src/auth.config.js': ['src/lib/auth/session-safety.js'],
  'src/lib/auth/session-safety.js': [],
  'src/lib/auth/repository.ts': [
    'server-only',
    'src/lib/db/index.ts',
    'src/lib/db/schema.ts',
    'drizzle-orm',
  ],
  'src/lib/credentials/server.ts': ['server-only', 'src/lib/credentials/service.ts'],
  'src/lib/credentials/service.ts': [
    'server-only',
    'src/lib/credentials/errors.ts',
    'src/lib/credentials/crypto.ts',
    'src/lib/credentials/keyring.ts',
    'src/lib/credentials/repository.ts',
    'src/lib/credentials/types.ts',
  ],
  'src/lib/credentials/repository.ts': [
    'server-only',
    'drizzle-orm',
    'src/lib/db/client.ts',
    'src/lib/db/schema.ts',
    'src/lib/credentials/types.ts',
    'src/lib/credentials/maintenance.ts',
  ],
  'src/lib/credentials/crypto.ts': [
    'server-only',
    'node:crypto',
    'src/lib/credentials/errors.ts',
    'src/lib/credentials/types.ts',
  ],
  'src/lib/credentials/keyring.ts': [
    'server-only',
    'src/lib/credentials/errors.ts',
    'src/lib/credentials/types.ts',
  ],
  'src/lib/credentials/maintenance.ts': [
    'server-only',
    'src/lib/credentials/errors.ts',
    'src/lib/credentials/crypto.ts',
    'src/lib/credentials/types.ts',
  ],
  'src/lib/credentials/errors.ts': [],
  'src/lib/credentials/types.ts': [],
};
export const isSecurityContract = (file) =>
  file === 'src/auth.js' || file === 'src/lib/credentials/server.ts';
export function checkSecurityBoundaries(graph) {
  const errors = [];
  for (const [file, node] of graph) {
    const allowed = securityDependencies[file];
    if (allowed) {
      if (node.computedImports) errors.push(`security-computed-import: ${file}`);
      if (
        allowed.includes('server-only') &&
        !node.imports.some((e) => e.specifier === 'server-only' && !e.typeOnly)
      )
        errors.push(`Missing server-only: ${file}`);
      for (const edge of node.imports) {
        if (!allowed.includes(edge.target ?? edge.specifier))
          errors.push(`security-dependency: ${file} -> ${edge.target ?? edge.specifier}`);
      }
    }
    for (const edge of node.imports) {
      const target = edge.target;
      if (target === 'src/lib/auth/repository.ts' && file !== 'src/auth.js')
        errors.push(`security-deep-import: ${file} -> ${target}`);
      if (
        target?.startsWith('src/lib/credentials/') &&
        ![
          'src/lib/credentials/server.ts',
          'src/lib/credentials/errors.ts',
          'src/lib/credentials/types.ts',
        ].includes(target) &&
        !file.startsWith('src/lib/credentials/')
      )
        errors.push(`security-deep-import: ${file} -> ${target}`);
    }
  }
  return errors;
}
