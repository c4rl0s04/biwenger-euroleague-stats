import { expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

it('keeps Compare composition free of persistence and legacy service imports', () => {
  const root = path.resolve('src/features/compare');
  const files = fs
    .readdirSync(root, { recursive: true })
    .map(String)
    .filter((p) => /\.(ts|tsx|js)$/.test(p) && !p.includes('.test.'));
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    expect(source, file).not.toMatch(/from ['"][^'"]*(?:lib\/db|lib\/services|drizzle-orm)/);
    expect(source, file).not.toMatch(/Record<string, any>|\bany\[\]/);
    if (file.startsWith('server/')) expect(source, file).toMatch(/import 'server-only'/);
  }
});
it('registers both pages and both HTTP adapters without Compare query exceptions', () => {
  const policy = JSON.parse(fs.readFileSync('scripts/architecture/policy.json', 'utf8'));
  for (const entry of [
    'src/app/(app)/compare/page.tsx',
    'src/app/(app)/compare/[userId]/page.tsx',
    'src/app/api/compare/data/route.ts',
    'src/app/api/compare/data/lite/route.ts',
  ]) {
    expect(policy.entrypoints).toContain(entry);
  }
  expect(
    policy.exceptions.filter((x: { edge: string }) => x.edge.includes('features/compare'))
  ).toEqual([]);
});
