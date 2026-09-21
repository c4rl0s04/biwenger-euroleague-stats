import { expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

it('keeps Dashboard persistence-free and uses explicit typed domain contracts', () => {
  const root = path.resolve('src/features/dashboard');
  const files = fs
    .readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => /\.(ts|tsx|js)$/.test(file) && !file.includes('.test.'));
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    expect(source, file).not.toMatch(/from ['"][^'"]*(?:lib\/db|lib\/services|drizzle-orm)/);
    expect(source, file).not.toMatch(/Record<string, any>|\bany\b/);
    expect(source, file).not.toMatch(
      /unstable_cache|\buse cache\b|import.*\bcache\b.*from ['"]react/
    );
    if (file.includes('server/services/')) expect(source, file).toMatch(/^import 'server-only';/);
  }
  const entry = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
  expect(entry).toMatch(/^import 'server-only';/);
  expect(fs.readFileSync(path.join(root, 'public.ts'), 'utf8')).not.toContain('/server');
});
it('registers all eleven HTTP adapters with only the existing leader-gap authentication exceptions', () => {
  const policy = JSON.parse(fs.readFileSync('scripts/architecture/policy.json', 'utf8'));
  for (const name of [
    'birthdays',
    'rising-stars',
    'top-players',
    'top-form',
    'market-opportunities',
    'mvps',
    'next-round',
    'leader-gap',
    'recent-activity',
    'ideal-lineup',
  ])
    expect(policy.entrypoints).toContain(`src/app/api/dashboard/${name}/route.ts`);
  expect(policy.entrypoints).toContain('src/app/api/league-average/route.ts');
  expect(
    policy.exceptions.filter((e: { edge: string }) => e.edge.includes('features/dashboard'))
  ).toEqual([]);
  const edges = policy.exceptions.filter((e: { edge: string }) => e.edge.includes('/leader-gap/'));
  expect(edges).toHaveLength(6);
  for (const edge of edges)
    expect(edge.edge).toMatch(/-> (src\/auth.js|src\/lib\/credentials\/repository.ts) ->/);
});
it('pages use Dashboard services directly while composition and News remain assigned to Tasks 07/08', () => {
  for (const file of [
    'src/app/(app)/dashboard/page.js',
    'src/app/(app)/dashboard/[section]/page.tsx',
  ]) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const imports = ast.statements
      .filter(ts.isImportDeclaration)
      .map((node) => (node.moduleSpecifier as ts.StringLiteral).text);
    expect(imports).toContain('@/features/dashboard/server');
    expect(imports).not.toContain('@/lib/services');
    expect(imports.some((name) => name.includes('/db'))).toBe(false);
    expect(source).not.toContain('Record<string, any>');
    expect(source).not.toMatch(/fetch\(['"]\/api/);
  }
  expect(
    fs.readFileSync('src/components/mobile/screens/MobileDashboardScreen.tsx', 'utf8')
  ).toContain("from '@/features/dashboard/public'");
});
