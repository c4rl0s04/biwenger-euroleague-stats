import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');

it.each([
  ['features/matches/server/queries/match-list.query.ts', '@/lib/db/connection'],
  ['lib/db/queries/core/playerForm.ts', '../../connection'],
])('%s uses the database-only connection instead of the legacy domain barrel', (file, expected) => {
  const source = ts.createSourceFile(
    file,
    readFileSync(path.join(root, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  const imports = source.statements
    .filter(ts.isImportDeclaration)
    .flatMap((statement) =>
      ts.isStringLiteral(statement.moduleSpecifier) ? [statement.moduleSpecifier.text] : []
    );
  expect(imports).toContain(expected);
  expect(imports).not.toContain('@/lib/db');
  expect(imports).not.toContain('../../index');
});
