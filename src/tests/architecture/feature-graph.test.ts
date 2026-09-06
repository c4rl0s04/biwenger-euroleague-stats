import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { inspectFeatureGraph } from './feature-graph';

const inspect = (files: Record<string, string>) =>
  inspectFeatureGraph(new Map(Object.entries(files)));

describe('feature import graph analyzer', () => {
  it('follows aliases, relative re-exports, and dynamic imports to server-only code', () => {
    const findings = inspect({
      'src/features/a/public.ts': "export { Screen } from './screen';",
      'src/features/a/screen.tsx': "'use client'; const x = import('@/lib/bridge');",
      'src/lib/bridge.ts': "export * from './private.js';",
      'src/lib/private.ts': "import 'server-only';",
    });
    expect(findings).toContainEqual({
      rule: 'client-to-server',
      chain: [
        'src/features/a/public.ts',
        'src/features/a/screen.tsx',
        'src/lib/bridge.ts',
        'src/lib/private.ts',
        'server-only',
      ],
    });
  });

  it('does not traverse type-only imports, including mixed declarations', () => {
    expect(
      inspect({
        'src/features/a/public.ts':
          "import type { X } from './server'; export type { X } from './server'; import { type Y } from './server'; type Z = import('./server').X;",
        'src/features/a/server.ts': "import 'server-only';",
      })
    ).toEqual([]);
  });

  it('includes runtime symbols in mixed imports and CommonJS requires', () => {
    expect(
      inspect({
        'src/features/a/public.ts':
          "import { type X, value } from './server'; const x = require('node:fs');",
        'src/features/a/server.ts': "import 'server-only';",
      }).some((finding) => finding.rule === 'client-to-server')
    ).toBe(true);
  });

  it('rejects deep imports even when relative or type-only', () => {
    expect(
      inspect({
        'src/features/a/public.ts': "import type { X } from '../b/models/x';",
        'src/features/b/models/x.ts': 'export type X = string;',
      })
    ).toContainEqual({
      rule: 'foreign-deep-import',
      chain: ['src/features/a/public.ts', 'src/features/b/models/x.ts'],
    });
  });

  it('detects cycles mediated by shared infrastructure', () => {
    const findings = inspect({
      'src/features/a/server.ts': "import '@/lib/bridge';",
      'src/lib/bridge.ts': "import '@/features/b/server';",
      'src/features/b/server.ts': "import '@/features/a/server';",
    });
    expect(findings).toContainEqual({ rule: 'feature-cycle', chain: ['a', 'b', 'a'] });
  });

  it('rejects unresolvable and computed client imports instead of silently skipping them', () => {
    const findings = inspect({
      'src/features/a/public.ts': "import './missing'; const x = import(variable);",
    });
    expect(findings.filter((finding) => finding.rule === 'unresolved-client-import')).toHaveLength(
      2
    );
  });

  it('accepts deliberate contracts and harmless local import cycles', () => {
    expect(
      inspect({
        'src/features/a/public.ts': "export * from './screen';",
        'src/features/a/screen.ts': "import './public'; import 'react'; import './style.css';",
        'src/features/a/server.ts': "import '@/features/b/server';",
        'src/features/b/server.ts': "import 'server-only';",
      })
    ).toEqual([]);
  });
});

it('enforces migrated feature boundaries across the actual source graph', () => {
  const root = path.resolve(import.meta.dirname, '../../..');
  const sources = new Map<string, string>();
  function collect(directory: string) {
    for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!['__tests__', 'tests'].includes(entry.name)) collect(file);
      } else if (/\.[cm]?[jt]sx?$/.test(file) && !/\.(test|spec)\./.test(file))
        sources.set(file, readFileSync(path.join(root, file), 'utf8'));
    }
  }
  collect('src');
  expect(inspectFeatureGraph(sources)).toEqual([]);
});
