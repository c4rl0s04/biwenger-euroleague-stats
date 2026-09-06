import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

function parse(relativePath: string) {
  return ts.createSourceFile(
    relativePath,
    readFileSync(new URL(relativePath, import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
}

describe.each(['matches', 'teams', 'players'])('%s reference entrypoint', (feature) => {
  it('exposes only server implementation, validation, or model modules from server.ts', () => {
    const file = parse(`./${feature}/server.ts`);
    for (const statement of file.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      const specifier = statement.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier)) continue;
      if (specifier.text === 'server-only') continue;
      const typeOnly = ts.isExportDeclaration(statement)
        ? statement.isTypeOnly
        : statement.importClause?.isTypeOnly;
      expect(specifier.text).toMatch(
        typeOnly ? /^\.\/(server|validation|models)\// : /^\.\/(server|validation)\//
      );
    }
  });
});

describe.each([
  ['../app/(app)/players/page.js', ['PlayersScreen']],
  ['../app/(app)/players/[section]/page.tsx', ['PlayerCatalogueSectionScreen']],
  ['../app/(app)/player/[id]/page.js', ['PlayerProfileScreen', 'PlayerProfileNotFoundScreen']],
  ['../app/(app)/player/[id]/[section]/page.tsx', ['PlayerProfileSectionScreen']],
] as const)('%s presentation imports', (path, screens) => {
  it('gets screens from public.ts while retaining direct server services', () => {
    const imports = parse(path).statements.filter(ts.isImportDeclaration);
    const moduleFor = (symbol: string) => {
      const declaration = imports.find((item) => {
        const bindings = item.importClause?.namedBindings;
        return (
          bindings &&
          ts.isNamedImports(bindings) &&
          bindings.elements.some(
            (element) => (element.propertyName ?? element.name).text === symbol
          )
        );
      });
      const specifier = declaration?.moduleSpecifier;
      return specifier && ts.isStringLiteral(specifier) ? specifier.text : undefined;
    };
    for (const screen of screens) expect(moduleFor(screen)).toBe('@/features/players/public');
    expect(
      imports.some(
        (item) =>
          ts.isStringLiteral(item.moduleSpecifier) &&
          item.moduleSpecifier.text === '@/features/players/server'
      )
    ).toBe(true);
  });
});
