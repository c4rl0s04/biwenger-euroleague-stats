import path from 'node:path';
import ts from 'typescript';

type Edge = { specifier: string; runtime: boolean; target?: string };
type Module = { edges: Edge[]; client: boolean; dynamic: boolean };
export type BoundaryFinding = { rule: string; chain: string[] };

function imports(file: string, source: string): Module {
  const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const result: Module = { edges: [], client: false, dynamic: false };
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const specifier = node.moduleSpecifier;
      if (specifier && ts.isStringLiteral(specifier)) {
        const clause = ts.isImportDeclaration(node) ? node.importClause : undefined;
        const bindings =
          clause?.namedBindings ?? (ts.isExportDeclaration(node) ? node.exportClause : undefined);
        const allTypeElements =
          bindings &&
          'elements' in bindings &&
          bindings.elements.length > 0 &&
          bindings.elements.every((item) => item.isTypeOnly);
        const typeOnly = ts.isExportDeclaration(node) ? node.isTypeOnly : clause?.isTypeOnly;
        result.edges.push({
          specifier: specifier.text,
          runtime: !typeOnly && !(allTypeElements && !clause?.name),
        });
      }
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      result.edges.push({ specifier: node.argument.literal.text, runtime: false });
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const arg = node.arguments[0];
      if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)))
        result.edges.push({ specifier: arg.text, runtime: true });
      else result.dynamic = true;
    }
    ts.forEachChild(node, visit);
  }
  visit(syntax);
  result.client = syntax.statements.some(
    (node) =>
      ts.isExpressionStatement(node) &&
      ts.isStringLiteral(node.expression) &&
      node.expression.text === 'use client'
  );
  return result;
}

/** Static source graph only: no application modules or database/provider code are executed. */
export function inspectFeatureGraph(sources: Map<string, string>): BoundaryFinding[] {
  const graph = new Map(Array.from(sources).map(([file, source]) => [file, imports(file, source)]));
  const findings: BoundaryFinding[] = [];
  const owner = (file: string) => /^src\/features\/([^/]+)\//.exec(file)?.[1];
  const entrypoint = (file: string) => /^src\/features\/[^/]+\/(public|server)\.ts$/.test(file);
  const features = new Set(
    Array.from(sources.keys())
      .map(owner)
      .filter((value): value is string => !!value)
  );
  const resolve = (file: string, specifier: string) => {
    const base = specifier.startsWith('@/')
      ? `src/${specifier.slice(2)}`
      : specifier.startsWith('.')
        ? path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier))
        : null;
    if (!base) return undefined;
    const stem = base.replace(/\.[cm]?jsx?$/, '');
    return [
      base,
      ...[
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.mts',
        '.mjs',
        '/index.ts',
        '/index.tsx',
        '/index.js',
      ].flatMap((extension) => [base + extension, stem + extension]),
    ].find((candidate) => sources.has(candidate));
  };
  for (const [file, node] of Array.from(graph)) {
    for (const edge of node.edges) {
      edge.target = resolve(file, edge.specifier);
      if (
        edge.target &&
        owner(edge.target) &&
        owner(file) !== owner(edge.target) &&
        !entrypoint(edge.target)
      )
        findings.push({ rule: 'foreign-deep-import', chain: [file, edge.target] });
    }
  }

  // Walk public entrypoints and feature Client Components through every local runtime edge.
  // Public barrels must be safe even when their consumers import a different named export.
  const roots = Array.from(graph)
    .filter(([file, node]) => owner(file) && (node.client || /\/public\.ts$/.test(file)))
    .map(([file]) => file);
  const serverPath = /(^src\/auth(?:\.|\/)|^src\/lib\/(db|credentials|api)\/|\/server(?:\.|\/))/;
  const serverPackage =
    /^(server-only|next\/headers|next\/server|pg|postgres|drizzle-orm|node:|fs(?:\/|$)|child_process(?:\/|$))/;
  for (const root of roots) {
    const visited = new Set<string>();
    const queue: string[][] = [[root]];
    while (queue.length) {
      const chain = queue.shift()!;
      const file = chain[chain.length - 1];
      if (visited.has(file)) continue;
      visited.add(file);
      const node = graph.get(file)!;
      if (serverPath.test(file)) findings.push({ rule: 'client-to-server', chain });
      if (node.dynamic) findings.push({ rule: 'unresolved-client-import', chain });
      for (const edge of node.edges.filter((edge) => edge.runtime)) {
        if (serverPackage.test(edge.specifier))
          findings.push({ rule: 'client-to-server', chain: [...chain, edge.specifier] });
        if (edge.target) queue.push([...chain, edge.target]);
        else if (
          /^(\.|@\/)/.test(edge.specifier) &&
          !/\.(css|scss|json|svg|png|jpg|webp)$/.test(edge.specifier)
        )
          findings.push({ rule: 'unresolved-client-import', chain: [...chain, edge.specifier] });
      }
    }
  }

  // Include dependencies mediated by legacy/shared modules, and type dependencies.
  const dependencies = new Map<string, Set<string>>();
  for (const feature of Array.from(features)) {
    const targets = new Set<string>();
    const visited = new Set<string>();
    const queue = Array.from(graph.keys()).filter((file) => owner(file) === feature);
    while (queue.length) {
      const file = queue.shift()!;
      if (visited.has(file)) continue;
      visited.add(file);
      for (const edge of graph.get(file)!.edges) {
        if (!edge.target) continue;
        const targetOwner = owner(edge.target);
        if (targetOwner && targetOwner !== feature) targets.add(targetOwner);
        else queue.push(edge.target);
      }
    }
    dependencies.set(feature, targets);
  }
  for (const root of Array.from(features)) {
    const visit = (current: string, chain: string[]) => {
      for (const target of Array.from(dependencies.get(current) ?? [])) {
        if (target === root) findings.push({ rule: 'feature-cycle', chain: [...chain, target] });
        else if (!chain.includes(target)) visit(target, [...chain, target]);
      }
    };
    visit(root, [root]);
  }
  return findings;
}
