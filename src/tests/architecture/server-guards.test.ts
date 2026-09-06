import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../features');

function modules(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return modules(file);
    return /\.(query|service|repository|action)\.ts$/.test(file) ? [file] : [];
  });
}

describe('feature persistence and orchestration guards', () => {
  const files = modules(root);
  it('discovers the existing guarded application modules', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it.each(files)('%s starts with an explicit side-effect server-only import', (file) => {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    );
    const first = source.statements[0];
    expect(ts.isImportDeclaration(first)).toBe(true);
    if (!ts.isImportDeclaration(first)) return;
    expect(first.importClause).toBeUndefined();
    expect(ts.isStringLiteral(first.moduleSpecifier) && first.moduleSpecifier.text).toBe(
      'server-only'
    );
  });
});
