import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Provider feature architecture boundary', () => {
  const root = path.resolve(__dirname, '../..');

  it('server.ts begins with server-only import', () => {
    const serverEntry = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
    expect(serverEntry.trimStart().startsWith("import 'server-only';")).toBe(true);
  });

  it('public.ts contains no server-only imports', () => {
    const publicEntry = fs.readFileSync(path.join(root, 'public.ts'), 'utf-8');
    expect(publicEntry).not.toContain('server-only');
  });

  it('public.ts exports only types, no executable server functions', async () => {
    const publicExports = await import('../../public');
    // public.ts only exports TypeScript types/interfaces, which compile away to an empty runtime object
    expect(Object.keys(publicExports)).toHaveLength(0);
  });
});
