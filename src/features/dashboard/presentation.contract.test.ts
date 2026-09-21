import fs from 'node:fs';
import ts from 'typescript';
import { expect, it } from 'vitest';
import originalRequests from './request-contract.fixture.json';

const printer = ts.createPrinter({ removeComments: true });
const parse = (file: string) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

// Captured from unchanged a5a44db0: URLs, identity timing, transformations and browser caches.
it.each(Object.entries(originalRequests))(
  'preserves the original %s browser request contract',
  (name, expected) => {
    const ast = parse(`src/features/dashboard/components/cards/${name}`);
    const calls: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useApiData')
        calls.push(printer.printNode(ts.EmitHint.Expression, node, ast));
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(calls).toEqual(expected);
  }
);

it('keeps presentation free of authentication, service orchestration and database reads', () => {
  for (const name of [
    'DesktopDashboardScreen',
    'MobileDashboardScreen',
    'MobileDashboardSectionScreen',
  ]) {
    const ast = parse(`src/features/dashboard/screens/${name}.tsx`);
    for (const node of ast.statements.filter(ts.isImportDeclaration)) {
      if (node.importClause?.isTypeOnly) continue;
      expect((node.moduleSpecifier as ts.StringLiteral).text).not.toMatch(
        /\/server|\/auth$|lib\/db|lib\/services/
      );
    }
    expect(ast.getText()).not.toMatch(/\basync\b|\bawait\b/);
  }
});

it('keeps all original dynamic card declarations, SSR options and loading boundaries', () => {
  const ast = parse('src/features/dashboard/screens/DesktopDashboardScreen.tsx');
  const calls: ts.CallExpression[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'nextDynamic')
      calls.push(node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  expect(calls).toHaveLength(13);
  expect(calls.filter((call) => /ssr: true/.test(call.getText(ast)))).toHaveLength(12);
  expect(calls.every((call) => /loading:/.test(call.getText(ast)))).toBe(true);
  expect(ast.getText()).not.toContain('ssr: false');
  expect(ast.getText()).not.toContain('<IdealLineupCard');
  expect(ast.getText()).not.toContain('<RecentActivityCard');
  expect(ast.getText()).not.toContain('<KpiBentoCard');
});
