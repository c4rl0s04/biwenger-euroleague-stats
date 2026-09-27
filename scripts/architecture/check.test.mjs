import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { readGraph, checkGraph } from './check.mjs';

function check(files, policy = { entrypoints: [], exceptions: [] }) {
  const root = mkdtempSync(path.join(tmpdir(), 'feature-graph-'));
  try {
    const all = {
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['src/*'] },
          allowJs: true,
          moduleResolution: 'bundler',
          module: 'esnext',
        },
      }),
      ...files,
    };
    for (const [file, content] of Object.entries(all)) {
      const target = path.join(root, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    return checkGraph(readGraph(root), policy);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('feature import graph', () => {
  it('validates authentication internals even when reached through the permanent contract', () => {
    const route = 'src/app/api/auth/[...nextauth]/route.ts';
    const files = {
      [route]: "import '@/auth';",
      'src/auth.js': "import 'server-only'; import '@/lib/auth/repository';",
      'src/lib/auth/repository.ts': "import 'server-only'; import 'drizzle-orm';",
    };
    const policy = { entrypoints: [route], exceptions: [] };
    expect(check(files, policy)).toEqual([]);
    expect(
      check({ ...files, 'src/auth.js': "import 'server-only'; import 'drizzle-orm';" }, policy)
    ).toContain('security-dependency: src/auth.js -> drizzle-orm');
    expect(check({ ...files, [route]: "import '@/lib/auth/repository';" }, policy)).toContain(
      `security-deep-import: ${route} -> src/lib/auth/repository.ts`
    );
    expect(
      check(
        {
          ...files,
          'src/auth.js': "import 'server-only'; import '@/lib/leak';",
          'src/lib/leak.ts': "import 'drizzle-orm';",
        },
        policy
      )
    ).toContain('security-dependency: src/auth.js -> src/lib/leak.ts');
    expect(
      check(
        { ...files, 'src/components/Legacy.js': "'use client'; import '@/auth';" },
        policy
      ).some((e) => e.startsWith('client-leak:'))
    ).toBe(true);
    expect(
      check({ ...files, 'src/auth.js': "import 'server-only'; import(variable);" }, policy)
    ).toContain('security-computed-import: src/auth.js');
  });

  it('enforces credential contract internals and rejects direct or transitive leaks', () => {
    const route = 'src/app/api/example/route.ts';
    const files = {
      [route]: "import '@/lib/credentials/server';",
      'src/lib/credentials/server.ts': "import 'server-only'; export { value } from './service';",
      'src/lib/credentials/service.ts': "import 'server-only'; export const value = 1;",
    };
    const policy = { entrypoints: [route], exceptions: [] };
    expect(check(files, policy)).toEqual([]);
    expect(check({ ...files, [route]: "import '@/lib/credentials/service';" }, policy)).toContain(
      `security-deep-import: ${route} -> src/lib/credentials/service.ts`
    );
    expect(
      check(
        { ...files, 'src/lib/credentials/service.ts': "import 'server-only'; import 'pg';" },
        policy
      )
    ).toContain('security-dependency: src/lib/credentials/service.ts -> pg');
    expect(
      check(
        {
          ...files,
          'src/components/Legacy.js': "'use client'; import '@/lib/credentials/server';",
        },
        policy
      ).some((e) => e.startsWith('client-leak:'))
    ).toBe(true);
    expect(
      check(
        { ...files, 'src/lib/credentials/server.ts': "export { value } from './service';" },
        policy
      )
    ).toContain('Missing server-only: src/lib/credentials/server.ts');
  });

  it('keeps the manager-read exception exact and rejects it once the adapter disappears', () => {
    const adapter = 'src/features/players/server/services/player-user-read.service.ts';
    const legacy = 'src/lib/services/core/userService.ts';
    const policy = {
      entrypoints: [],
      exceptions: [
        {
          edge: `legacy-service: ${adapter} -> ${legacy}`,
          reason: 'Temporary manager adapter',
          removeWhen: 'Managers owns these reads',
        },
      ],
    };
    const files = {
      [adapter]: "import '@/lib/services/core/userService';",
      [legacy]: 'export {};',
    };
    expect(check(files, policy)).toEqual([]);
    expect(
      check(
        { ...files, 'src/features/players/server/services/other.service.ts': files[adapter] },
        policy
      )
    ).toContain(
      `legacy-service: src/features/players/server/services/other.service.ts -> ${legacy}`
    );
    expect(check({ [adapter]: 'export {};', [legacy]: 'export {};' }, policy)).toContain(
      `Stale exception: legacy-service: ${adapter} -> ${legacy}`
    );
  });

  it('requires season persistence behind a query rather than a service', () => {
    const service = 'src/features/rounds/server/services/calendar.service.ts';
    const query = 'src/features/rounds/server/queries/calendar-season.query.ts';
    const season = 'src/lib/db/season-context.ts';
    const files = { [service]: "import '@/lib/db/season-context';", [season]: 'export {};' };
    expect(check(files)).toContain(`persistence-owner: ${service} -> ${season}`);
    expect(
      check({
        ...files,
        [service]: "import '../queries/calendar-season.query';",
        [query]: "import 'server-only'; import '@/lib/db/season-context';",
      })
    ).toEqual([]);
  });

  it('detects persistence hidden behind a page helper', () => {
    const errors = check(
      {
        'src/app/page.tsx': "export { load } from '../lib/helper';",
        'src/lib/helper.ts': "export const load = () => require('pg');",
      },
      { entrypoints: ['src/app/page.tsx'], exceptions: [] }
    );
    expect(errors.some((error) => error.startsWith('entrypoint-persistence:'))).toBe(true);
  });
  it('fails closed on nonliteral feature imports', () => {
    const errors = check({
      'src/features/a/server/load.ts': 'export const load = (name) => import(name);',
    });
    expect(errors.some((error) => error.startsWith('computed-import:'))).toBe(true);
  });

  it('allows deliberate contracts and type-only models', () => {
    expect(
      check({
        'src/features/a/public.ts': "export type { Model } from './models/model';",
        'src/features/a/models/model.ts': 'export type Model = { value: number };',
        'src/features/a/server.ts': "import 'server-only'; export const get = () => 1;",
        'src/features/b/server.ts':
          "import 'server-only'; export { get } from '@/features/a/server';",
        'src/app/page.tsx': "import { get } from '@/features/b/server';",
      })
    ).toEqual([]);
  });
  it('rejects alias and relative cross-feature deep imports, even type imports', () => {
    const errors = check({
      'src/features/a/models.ts': 'export type Model = number;',
      'src/features/b/public.ts': "export type { Model } from '../a/models';",
      'src/app/page.tsx': "import type { Model } from '@/features/a/models';",
    });
    expect(errors.filter((error) => error.startsWith('deep-import'))).toHaveLength(2);
  });
  it('detects server code through intermediate barrels and dynamic imports', () => {
    const errors = check({
      'src/features/a/public.ts': "export * from './helper';",
      'src/features/a/helper.ts': "export const load = () => import('../../lib/bridge');",
      'src/lib/bridge.ts': "export * from './db/query';",
      'src/lib/db/query.ts': 'export const query = () => 1;',
    });
    expect(
      errors.some((error) => error.includes('client-leak') && error.includes('src/lib/db/query.ts'))
    ).toBe(true);
  });
  it('rejects runtime require of persistence from client components', () => {
    const errors = check({
      'src/features/a/components/Widget.js': "'use client'; const pg = require('pg');",
    });
    expect(errors.some((error) => error.includes('client-leak'))).toBe(true);
  });
  it('does not treat type-only re-exports as runtime leaks', () => {
    expect(
      check({
        'src/features/a/public.ts': "export type { Value } from '../../lib/types';",
        'src/lib/types.ts': "import 'server-only'; export type Value = string;",
      })
    ).toEqual([]);
  });
  it('detects feature dependency cycles including types', () => {
    const errors = check({
      'src/features/a/public.ts': "export type { B } from '../b/public'; export type A = number;",
      'src/features/b/public.ts': "export type { A } from '../a/public'; export type B = number;",
    });
    expect(errors.some((error) => error.startsWith('Feature cycle:'))).toBe(true);
  });
  it('enforces protected route boundaries and rejects stale exceptions', () => {
    const errors = check(
      {
        'src/app/api/a/route.ts': "import { db } from '@/lib/db/client';",
        'src/lib/db/client.ts': 'export const db = {};',
      },
      {
        entrypoints: ['src/app/api/a/route.ts'],
        exceptions: [{ edge: 'obsolete', reason: 'old', removeWhen: 'now' }],
      }
    );
    expect(errors.some((error) => error.startsWith('entrypoint:'))).toBe(true);
    expect(errors).toContain('Stale exception: obsolete');
  });
  it('requires an exact documented exception for existing migration debt', () => {
    const files = {
      'src/features/a/server/services/read.ts': "import { db } from '@/lib/db/client';",
      'src/lib/db/client.ts': 'export const db = {};',
    };
    const errors = check(files);
    expect(errors).toHaveLength(1);
    expect(
      check(files, {
        entrypoints: [],
        exceptions: [{ edge: errors[0], reason: 'Legacy adapter', removeWhen: 'Owner migrates' }],
      })
    ).toEqual([]);
  });
});

describe('shared competition ownership', () => {
  it('rejects retired helpers even when deleted, using alias and relative imports', () => {
    const errors = check({
      'src/lib/consumer.ts': "import '@/lib/utils/lineup-logic'; import './db/queries/core/users';",
    });
    expect(errors).toContain(
      'retired-domain-import: src/lib/consumer.ts -> src/lib/utils/lineup-logic'
    );
    expect(errors).toContain(
      'retired-domain-import: src/lib/consumer.ts -> src/lib/db/queries/core/users'
    );
  });
  it('permits pure and server contracts but rejects deep consumers', () => {
    const files = {
      'src/lib/competition/public.ts': "export * from './logic/score';",
      'src/lib/competition/logic/score.ts': 'export const score = 1;',
      'src/lib/competition/server.ts':
        "import 'server-only'; export * from './server/queries/form';",
      'src/lib/competition/server/queries/form.ts': "import '@/lib/db/client';",
      'src/lib/db/client.ts': 'export const db = {};',
      'src/features/example/server/queries/read.ts': "import '@/lib/competition/server';",
      'src/features/example/public.ts': "export * from '@/lib/competition/public';",
    };
    expect(check(files)).toEqual([]);
    expect(
      check({ ...files, 'src/lib/consumer.ts': "import './competition/logic/score';" })
    ).toContain(
      'competition-deep-import: src/lib/consumer.ts -> src/lib/competition/logic/score.ts'
    );
  });
  it('rejects dependencies on features and database access from pure logic', () => {
    const errors = check({
      'src/lib/competition/logic/score.ts':
        "import '@/features/example/public'; import '@/lib/db/client';",
      'src/features/example/public.ts': 'export const score = 1;',
      'src/lib/db/client.ts': 'export const db = {};',
    });
    expect(errors).toContain(
      'competition-dependency: src/lib/competition/logic/score.ts -> src/features/example/public.ts'
    );
    expect(errors).toContain(
      'competition-dependency: src/lib/competition/logic/score.ts -> src/lib/db/client.ts'
    );
  });
  it('detects transitive server leaks in the public contract without a client consumer', () => {
    expect(
      check({
        'src/lib/competition/public.ts': "export * from './logic/score';",
        'src/lib/competition/logic/score.ts': "export * from '../server/queries/form';",
        'src/lib/competition/server/queries/form.ts':
          "import 'server-only'; export const score = 1;",
      }).some((error) => error.startsWith('client-leak: src/lib/competition/public.ts'))
    ).toBe(true);
  });
  it('requires the server-only marker and rejects dynamic imports and provider dependencies', () => {
    const errors = check({
      'src/lib/competition/server.ts': 'export const score = 1;',
      'src/lib/competition/logic/score.ts':
        "import '@/lib/api/biwenger-client'; const name = 'x'; import(name);",
      'src/lib/api/biwenger-client.ts': 'export const client = {};',
    });
    expect(errors).toContain('Missing server-only: src/lib/competition/server.ts');
    expect(errors.some((error) => error.startsWith('competition-computed-import:'))).toBe(true);
    expect(errors.some((error) => error.startsWith('competition-dependency:'))).toBe(true);
  });
});

describe('Hoopgrid operational ownership', () => {
  it('rejects direct persistence and deep feature imports from the CLI, including relative paths', () => {
    expect(
      check({
        'src/lib/db/client.ts': 'export const db = {};',
        'src/features/hoopgrid/server/repositories/repo.ts': 'export const repo = {};',
        'scripts/hoopgrid/generate-hard.ts':
          "import '../../src/lib/db/client'; import '../../src/features/hoopgrid/server/repositories/repo'; import 'drizzle-orm';",
      }).filter((e) => e.startsWith('domain-cli-boundary'))
    ).toHaveLength(3);
  });
  it('allows the server contract from the CLI', () => {
    expect(
      check({
        'src/features/hoopgrid/server.ts': "import 'server-only';",
        'scripts/hoopgrid/generate-hard.ts':
          "const service = import('@/features/hoopgrid/server');",
      })
    ).toEqual([]);
  });
});
