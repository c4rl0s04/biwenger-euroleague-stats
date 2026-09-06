import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return ts.createSourceFile(
    path,
    readFileSync(resolve(process.cwd(), path), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
}

describe('Search boundaries', () => {
  it('keeps public exports client-safe and independent of persistence types', () => {
    const declarations = source('src/features/search/public.ts').statements;
    expect(declarations).toHaveLength(1);
    for (const declaration of declarations) {
      expect(ts.isExportDeclaration(declaration) && declaration.isTypeOnly).toBe(true);
    }
    const model = readFileSync(
      resolve(process.cwd(), 'src/features/search/models/search.ts'),
      'utf8'
    );
    expect(model).not.toMatch(/\b(?:import|any)\b/);
  });

  it.each(['server.ts', 'server/services/search.service.ts', 'server/queries/search.query.ts'])(
    'guards privileged module %s',
    (path) => {
      const first = source(`src/features/search/${path}`).statements[0];
      expect(
        ts.isImportDeclaration(first) &&
          first.importClause === undefined &&
          ts.isStringLiteral(first.moduleSpecifier) &&
          first.moduleSpecifier.text === 'server-only'
      ).toBe(true);
    }
  );

  it('makes the HTTP adapter consume only the deliberate Search server contract', () => {
    const route = source('src/app/api/search/route.ts');
    const imports = route.statements
      .filter(ts.isImportDeclaration)
      .map((statement) => (statement.moduleSpecifier as ts.StringLiteral).text);
    expect(imports).toContain('@/features/search/server');
    expect(imports).not.toContain('@/lib/services');
    expect(imports.some((path) => path.includes('/db') || path.includes('/queries/'))).toBe(false);
  });
});
