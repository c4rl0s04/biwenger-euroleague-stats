import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { readGraph, checkGraph } from '../../../scripts/architecture/check.mjs';
import { classifyModule } from '../../../scripts/architecture/ownership-inventory.mjs';

it('includes operational callers, re-exports and literal dynamic imports without counting tests', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'ownership-graph-'));
  const files = {
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
        moduleResolution: 'bundler',
        module: 'esnext',
      },
    }),
    'src/lib/connection.ts': 'export const db = {};',
    'src/lib/bridge.ts': "export { db } from './connection';",
    'scripts/read.ts':
      "import { db } from '@/lib/bridge'; const load = import('../src/lib/connection'); const unknown = import(variable);",
    'runtime.config.ts': "export { db } from './src/lib/connection';",
    'scripts/read.test.ts': "import '../src/lib/connection';",
  };
  try {
    for (const [file, contents] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      writeFileSync(path.join(root, file), contents);
    }
    expect(readGraph(root).has('scripts/read.ts')).toBe(false);
    const graph = readGraph(root, ['src', 'scripts', 'runtime.config.ts']);
    expect(graph.has('scripts/read.test.ts')).toBe(false);
    expect(graph.get('runtime.config.ts')?.imports[0].target).toBe('src/lib/connection.ts');
    expect(
      graph.get('scripts/read.ts')?.imports.map((edge: { target: string | null }) => edge.target)
    ).toEqual(['src/lib/bridge.ts', 'src/lib/connection.ts']);
    expect(graph.get('scripts/read.ts')?.computedImports).toBe(true);
    expect(graph.get('src/lib/bridge.ts')?.imports[0].target).toBe('src/lib/connection.ts');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('does not allow a newly protected route to hide domain persistence behind a helper', () => {
  const graph = new Map([
    [
      'src/app/api/market/sell/route.ts',
      {
        imports: [{ specifier: '@/lib/leak', target: 'src/lib/leak.ts', typeOnly: false }],
        client: false,
        computedImports: false,
      },
    ],
    [
      'src/lib/leak.ts',
      {
        imports: [
          { specifier: '@/lib/db/client', target: 'src/lib/db/client.ts', typeOnly: false },
        ],
        client: false,
        computedImports: false,
      },
    ],
  ]);
  expect(
    checkGraph(graph, { entrypoints: ['src/app/api/market/sell/route.ts'], exceptions: [] })
  ).toContain(
    'entrypoint-persistence: src/app/api/market/sell/route.ts -> src/lib/leak.ts -> src/lib/db/client.ts'
  );
});

it('distinguishes retained shared projections, authentication gates and UI adapters', () => {
  expect(classifyModule('src/lib/db/queries/core/playerForm.ts').blocker).toBeNull();
  expect(classifyModule('src/lib/db/queries/core/manager-directory.ts').contract).toContain(
    'cycle'
  );
  expect(classifyModule('src/lib/db/queries/core/users.ts').blocker).toContain('security gate');
  expect(classifyModule('src/lib/services/app/appShellService.ts').blocker).toContain('25B');
});
