import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');

function collectTypeScriptFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(collectTypeScriptFiles(fullPath));
    } else if (
      file.endsWith('.ts') &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

const BANNED_SQL_PATTERN =
  /\b(?:p|players)\.(?:position|price|price_increment|team_id|puntos|status|partidos_jugados)\b|\b(?:t|teams)\.(?:city|arena_name|latitude|longitude)\b|COALESCE\s*\(\s*ps\.\w+\s*,\s*(?:p|players)\.\w+\s*\)/i;

describe('seasonal-column-reads architectural guard', () => {
  it('ensures no SQL query in src/ reads dropped seasonal columns from global tables', () => {
    const files = collectTypeScriptFiles(root);
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const file of files) {
      const sourceText = readFileSync(file, 'utf8');
      const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);

      const visit = (node: ts.Node): void => {
        let sqlText: string | null = null;
        if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) {
          sqlText = node.text;
        } else if (ts.isTemplateExpression(node)) {
          sqlText = node.getText(sourceFile);
        }

        if (sqlText && /\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|JOIN)\b/i.test(sqlText)) {
          const match = sqlText.match(BANNED_SQL_PATTERN);
          if (match) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              file: path.relative(root, file),
              line: line + 1,
              match: match[0],
            });
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    expect(violations).toEqual([]);
  });
});
