import { test, expect, describe } from 'vitest';
import ts from 'typescript';
import fs from 'fs';
import path from 'path';

describe('Service Cache Contract', () => {
  const serviceFiles = ['performance.service.ts', 'theoretical.service.ts', 'draft.service.ts'];

  const expectedExports = {
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
    'draft.service.ts': [
      'fetchInitialSquadStats',
      // fetchInitialSquadAnalytics was already fixed and verified in another test, but we can check it too.
      'fetchInitialSquadAnalytics',
    ],
  };

  for (const file of serviceFiles) {
    test(`File ${file} does not use React cache wrapper`, () => {
      const filePath = path.join(__dirname, file);
      const sourceFile = ts.createSourceFile(
        file,
        fs.readFileSync(filePath, 'utf8'),
        ts.ScriptTarget.Latest,
        true
      );

      // Check imports
      const hasReactCacheImport = sourceFile.statements.some((stmt) => {
        if (ts.isImportDeclaration(stmt)) {
          const moduleSpecifier = stmt.moduleSpecifier;
          if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === 'react') {
            const namedBindings = stmt.importClause?.namedBindings;
            if (namedBindings && ts.isNamedImports(namedBindings)) {
              return namedBindings.elements.some((el) => el.name.text === 'cache');
            }
          }
        }
        return false;
      });

      expect(hasReactCacheImport).toBe(false);

      // Check exports
      const exportsToCheck = expectedExports[file as keyof typeof expectedExports];

      const exportedNames = new Set<string>();

      sourceFile.statements.forEach((stmt) => {
        if (
          ts.isVariableStatement(stmt) &&
          stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          stmt.declarationList.declarations.forEach((decl) => {
            if (ts.isIdentifier(decl.name)) {
              const name = decl.name.text;
              if (exportsToCheck.includes(name)) {
                exportedNames.add(name);

                // Assert it's an arrow function or function expression
                // e.g. export const fetchVolatilityStats = async () => { ... }
                // and NOT a CallExpression (like cache(async () => { ... }))
                expect(decl.initializer).toBeDefined();
                const isFunctionLike =
                  ts.isArrowFunction(decl.initializer!) ||
                  ts.isFunctionExpression(decl.initializer!);
                expect(isFunctionLike, `${name} must be a function, not a wrapper`).toBe(true);

                if (ts.isCallExpression(decl.initializer!)) {
                  // Double check it's not cache(...)
                  if (ts.isIdentifier(decl.initializer.expression)) {
                    expect(decl.initializer.expression.text).not.toBe('cache');
                  }
                }
              }
            }
          });
        }
      });

      // Ensure we found all the exports we're supposed to check
      exportsToCheck.forEach((exp) => {
        expect(exportedNames.has(exp), `Export ${exp} was not found`).toBe(true);
      });
    });
  }
});
