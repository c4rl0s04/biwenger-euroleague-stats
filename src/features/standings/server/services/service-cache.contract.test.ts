import { test, expect, describe } from 'vitest';
import ts from 'typescript';
import fs from 'fs';
import path from 'path';

/** Parse a source string into a TS AST */
function parse(source: string, fileName = 'test.ts') {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
}

/** Check if a source file has a React cache import (including aliased) */
function hasReactCacheImport(sourceFile: ts.SourceFile): boolean {
  return sourceFile.statements.some((stmt) => {
    if (ts.isImportDeclaration(stmt)) {
      const moduleSpecifier = stmt.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === 'react') {
        const namedBindings = stmt.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          return namedBindings.elements.some((el) => {
            // Detect both `import { cache }` and `import { cache as X }`
            const importedName = el.propertyName?.text ?? el.name.text;
            return importedName === 'cache';
          });
        }
      }
    }
    return false;
  });
}

/** Verify that named exports are async arrow/function (not wrapped) */
function verifyExports(sourceFile: ts.SourceFile, names: string[]) {
  const found = new Set<string>();

  sourceFile.statements.forEach((stmt) => {
    if (
      ts.isVariableStatement(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      stmt.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name) && names.includes(decl.name.text)) {
          const name = decl.name.text;
          found.add(name);

          expect(decl.initializer).toBeDefined();

          const init = decl.initializer!;
          const isFunctionLike = ts.isArrowFunction(init) || ts.isFunctionExpression(init);
          expect(isFunctionLike, `${name} must be a direct function, not a wrapper`).toBe(true);

          // Assert AsyncKeyword is present
          if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
            const hasAsync = init.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
            expect(hasAsync, `${name} must be async`).toBe(true);
          }
        }
      });
    }
  });

  return found;
}

describe('Service Cache Contract', () => {
  const serviceFiles = ['performance.service.ts', 'theoretical.service.ts', 'draft.service.ts'];

  const expectedExports: Record<string, string[]> = {
    'performance.service.ts': [
      'fetchVolatilityStats',
      'fetchHeatCheckStats',
      'fetchHunterStats',
      'fetchRollingAverageStats',
      'fetchFloorCeilingStats',
      'fetchPointDistributionStats',
      'fetchDominanceStats',
      'fetchPositionChangesStats',
      'fetchReliabilityStats',
    ],
    'theoretical.service.ts': [
      'fetchTheoreticalGapStats',
      'fetchLeagueComparisonStats',
      'fetchRivalryMatrixStats',
      'fetchHeatmapStats',
      'fetchTheoreticalStandings',
    ],
    'draft.service.ts': ['fetchInitialSquadStats', 'fetchInitialSquadAnalytics'],
  };

  for (const file of serviceFiles) {
    test(`${file} has no React cache import and all exports are async functions`, () => {
      const filePath = path.join(__dirname, file);
      const source = fs.readFileSync(filePath, 'utf8');
      const sourceFile = parse(source, file);

      expect(hasReactCacheImport(sourceFile)).toBe(false);

      const exportsToCheck = expectedExports[file];
      const found = verifyExports(sourceFile, exportsToCheck);

      exportsToCheck.forEach((exp) => {
        expect(found.has(exp), `Export ${exp} was not found`).toBe(true);
      });
    });
  }
});

describe('Negative synthetic cases', () => {
  test('detects non-async function', () => {
    const source = `export const fetchFoo = () => {};`;
    const sf = parse(source);
    expect(() => verifyExports(sf, ['fetchFoo'])).toThrow('must be async');
  });

  test('detects cache-wrapped export', () => {
    const source = `import { cache } from 'react';
export const fetchFoo = cache(async () => {});`;
    const sf = parse(source);
    expect(() => verifyExports(sf, ['fetchFoo'])).toThrow('must be a direct function');
  });

  test('detects aliased React cache import', () => {
    const source = `import { cache as memoize } from 'react';`;
    const sf = parse(source);
    expect(hasReactCacheImport(sf)).toBe(true);
  });

  test('does not flag non-react cache import', () => {
    const source = `import { cache } from './my-utils';`;
    const sf = parse(source);
    expect(hasReactCacheImport(sf)).toBe(false);
  });
});
