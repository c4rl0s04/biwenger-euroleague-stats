import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { isSecurityContract, checkSecurityBoundaries } from './security-boundaries.mjs';

const normalize = (value) => value.split(path.sep).join('/');
const featureOf = (file) => /^src\/features\/([^/]+)\//.exec(file)?.[1];
const isCompetition = (file) => file.startsWith('src/lib/competition/');
const isCompetitionContract = (file) => /^src\/lib\/competition\/(public|server)\.ts$/.test(file);
const retiredDomainPaths =
  /^(src\/lib\/logic\/(standings|match-scores|ideal-lineup)|src\/lib\/utils\/(lineup-logic|player-finance|efficiency)|src\/lib\/db\/queries\/core\/(users|playerForm|manager-directory))(?:\.[cm]?[jt]sx?)?$/;
const isSeasonContract = (file) => file === 'src/lib/seasons/server.ts';
const isSharedPresentation = (file) => /^src\/components\/(shell|ui)\//.test(file);
const isContract = (file) => /^src\/features\/[^/]+\/(public|server)\.ts$/.test(file);
const isPersistence = (file) =>
  /^src\/lib\/db\//.test(file) || /\/server\/(queries|repositories)\//.test(file);
const isServer = (file) =>
  file === 'src/lib/auth/repository.ts' ||
  isSeasonContract(file) ||
  isPersistence(file) ||
  /^src\/lib\/(services|credentials)\//.test(file) ||
  /\/server(?:\/|\.ts$)/.test(file) ||
  /^src\/auth\./.test(file);
const isTest = (file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || file.includes('/__tests__/');
const externalServer = (name) =>
  /^(server-only|node:|pg$|drizzle-orm(?:\/|$)|next\/(headers|server)$|fs(?:\/|$)|path$|crypto$)/.test(
    name
  );

export function readGraph(root, sourceRoots = ['src', 'scripts/hoopgrid']) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') && !isTest(full))
        files.push(full);
    }
  }
  for (const entry of sourceRoots) {
    const full = path.join(root, entry);
    if (!existsSync(full)) continue;
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.[cm]?[jt]sx?$/.test(full) && !full.endsWith('.d.ts') && !isTest(full))
      files.push(full);
  }
  const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  if (configFile.error) throw new Error('Cannot read tsconfig.json');
  const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
  const graph = new Map();
  for (const full of files) {
    const file = normalize(path.relative(root, full));
    const source = ts.createSourceFile(
      full,
      readFileSync(full, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    );
    const imports = [];
    let computedImports = false;
    const add = (literal, typeOnly = false) => {
      if (!literal || !ts.isStringLiteralLike(literal)) return;
      const specifier = literal.text;
      const resolved = ts.resolveModuleName(specifier, full, config.options, ts.sys).resolvedModule;
      const target =
        resolved && !resolved.isExternalLibraryImport
          ? normalize(path.relative(root, resolved.resolvedFileName))
          : null;
      imports.push({ specifier, target, typeOnly });
    };
    function visit(node) {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        const bindings = clause?.namedBindings;
        const typeOnly =
          clause?.isTypeOnly ||
          (!clause?.name &&
            bindings &&
            ts.isNamedImports(bindings) &&
            bindings.elements.length > 0 &&
            bindings.elements.every((item) => item.isTypeOnly));
        add(node.moduleSpecifier, Boolean(typeOnly));
      } else if (ts.isExportDeclaration(node)) {
        const clause = node.exportClause;
        const typeOnly =
          node.isTypeOnly ||
          (clause &&
            ts.isNamedExports(clause) &&
            clause.elements.length > 0 &&
            clause.elements.every((item) => item.isTypeOnly));
        add(node.moduleSpecifier, Boolean(typeOnly));
      } else if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference)
      ) {
        add(node.moduleReference.expression, node.isTypeOnly);
      } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
        add(node.argument.literal, true);
      } else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
      ) {
        if (!node.arguments[0] || !ts.isStringLiteralLike(node.arguments[0]))
          computedImports = true;
        add(node.arguments[0]);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    const client = source.statements.some(
      (node) =>
        ts.isExpressionStatement(node) &&
        ts.isStringLiteral(node.expression) &&
        node.expression.text === 'use client'
    );
    graph.set(file, { imports, client, computedImports });
  }
  return graph;
}

export function checkGraph(graph, policy) {
  const errors = new Set(checkSecurityBoundaries(graph));
  const usedExceptions = new Set();
  const featureEdges = new Map();
  function report(kind, from, to) {
    const key = `${kind}: ${from} -> ${to}`;
    const exception = policy.exceptions.find((entry) => entry.edge === key);
    if (exception) {
      usedExceptions.add(key);
      if (!exception.reason || !exception.removeWhen) errors.add(`Incomplete exception: ${key}`);
    } else errors.add(key);
  }
  for (const [file, node] of graph) {
    const owner = featureOf(file);
    if (isCompetition(file)) {
      if (node.computedImports)
        report('competition-computed-import', file, 'nonliteral module target');
      if (
        file === 'src/lib/competition/server.ts' &&
        !node.imports.some((edge) => edge.specifier === 'server-only' && !edge.typeOnly)
      )
        errors.add(`Missing server-only: ${file}`);
    }
    if (isSeasonContract(file)) {
      if (!node.imports.some((edge) => edge.specifier === 'server-only' && !edge.typeOnly))
        errors.add(`Missing server-only: ${file}`);
      for (const edge of node.imports) {
        if (
          !['server-only', 'react', '@/lib/seasons', '@/lib/db/season-context'].includes(
            edge.specifier
          )
        )
          report('season-contract', file, edge.target ?? edge.specifier);
      }
    }
    if (
      (owner ||
        file.startsWith('scripts/hoopgrid/') ||
        isSharedPresentation(file) ||
        isSeasonContract(file) ||
        policy.entrypoints.includes(file)) &&
      node.computedImports
    )
      report('computed-import', file, 'nonliteral module target');
    for (const edge of node.imports) {
      const target = edge.target;
      if (
        file.startsWith('scripts/hoopgrid/') &&
        ((target && (isPersistence(target) || (featureOf(target) && !isContract(target)))) ||
          /^(?:@\/lib\/db(?:\/|$)|drizzle-orm(?:\/|$)|pg$)/.test(edge.specifier))
      )
        report('domain-cli-boundary', file, target ?? edge.specifier);

      const importPath =
        target ??
        (edge.specifier.startsWith('@/')
          ? `src/${edge.specifier.slice(2)}`
          : edge.specifier.startsWith('.')
            ? path.posix.normalize(path.posix.join(path.posix.dirname(file), edge.specifier))
            : edge.specifier);
      if (retiredDomainPaths.test(importPath)) report('retired-domain-import', file, importPath);
      if (target && isCompetition(target) && !isCompetition(file) && !isCompetitionContract(target))
        report('competition-deep-import', file, target);
      if (isCompetition(file)) {
        if ((file.includes('/logic/') || file.endsWith('/public.ts')) && target && isServer(target))
          report('competition-pure-server', file, target);
        const query = file.startsWith('src/lib/competition/server/queries/');
        const permittedInfrastructure =
          query &&
          target &&
          ['src/lib/db/client.ts', 'src/lib/db/season-context.ts'].includes(target);
        if (
          !(target && isCompetition(target)) &&
          !permittedInfrastructure &&
          !(edge.specifier === 'server-only' && (query || file.endsWith('/server.ts')))
        )
          report('competition-dependency', file, target ?? edge.specifier);
      }
      if (!target) {
        const protectedSource =
          policy.entrypoints.includes(file) ||
          (owner && !/\/server\/(queries|repositories)\//.test(file));
        if (protectedSource && /^(pg$|postgres$|drizzle-orm(?:\/|$))/.test(edge.specifier))
          report('persistence-owner', file, edge.specifier);
        if (
          (owner ||
            isSharedPresentation(file) ||
            isSeasonContract(file) ||
            policy.entrypoints.includes(file)) &&
          (edge.specifier.startsWith('@/') || edge.specifier.startsWith('.'))
        ) {
          if (!/\.(css|json|svg|png|jpe?g|webp)$/.test(edge.specifier))
            report('unresolved', file, edge.specifier);
        }
        continue;
      }
      const other = featureOf(target);
      if (other && owner !== other && !isContract(target)) report('deep-import', file, target);
      if (owner && other && owner !== other) {
        if (!featureEdges.has(owner)) featureEdges.set(owner, new Set());
        featureEdges.get(owner).add(other);
      }
      const protectedEntry = policy.entrypoints.includes(file);
      const presentation =
        isSharedPresentation(file) ||
        (owner &&
          (file.includes('/components/') ||
            file.endsWith('/public.ts') ||
            file.includes('/models/')));
      if (
        file.startsWith('src/components/ui/') &&
        (other || target.startsWith('src/components/shell/'))
      )
        report('primitive-ownership', file, target);
      if (
        protectedEntry &&
        (isPersistence(target) ||
          target.startsWith('src/lib/services/') ||
          (other && !isContract(target)))
      )
        report('entrypoint', file, target);
      if (presentation && isServer(target)) report('presentation', file, target);
      if (
        owner &&
        !/\/server\/(queries|repositories)\//.test(file) &&
        target.startsWith('src/lib/db/')
      )
        report('persistence-owner', file, target);
      if ((owner || isSharedPresentation(file)) && target.startsWith('src/lib/services/'))
        report('legacy-service', file, target);
    }
    if (
      owner &&
      file.endsWith('/server.ts') &&
      !node.imports.some((edge) => edge.specifier === 'server-only' && !edge.typeOnly)
    )
      errors.add(`Missing server-only: ${file}`);
  }
  // Framework adapters may reach services, but cannot hide SQL behind arbitrary helpers.
  for (const start of policy.entrypoints) {
    const seen = new Set();
    function inspect(file) {
      if (seen.has(file)) return;
      seen.add(file);
      for (const edge of graph.get(file)?.imports ?? []) {
        if (edge.typeOnly) continue;
        const target = edge.target;
        if (
          /^(pg$|postgres$|drizzle-orm(?:\/|$))/.test(edge.specifier) ||
          (target && isPersistence(target))
        ) {
          report('entrypoint-persistence', start, `${file} -> ${target ?? edge.specifier}`);
        } else if (
          target &&
          !isSeasonContract(target) &&
          !isSecurityContract(target) &&
          !/^src\/features\/[^/]+\/server\.ts$/.test(target)
        )
          inspect(target);
      }
    }
    inspect(start);
  }
  // Follow every runtime edge, including relative barrels and dynamic literal imports.
  // Type-only edges participate in ownership/cycles, but cannot leak runtime server code.
  for (const [start, node] of graph) {
    if (
      !node.client &&
      !isSharedPresentation(start) &&
      start !== 'src/lib/competition/public.ts' &&
      (!featureOf(start) ||
        !(node.client || start.endsWith('/public.ts') || start.includes('/components/')))
    )
      continue;
    const visited = new Set();
    function visit(file, trail) {
      if (visited.has(file)) return;
      visited.add(file);
      for (const edge of graph.get(file)?.imports ?? []) {
        if (edge.typeOnly) continue;
        const next = edge.target;
        if (externalServer(edge.specifier) || (next && isServer(next))) {
          report('client-leak', start, [...trail, next ?? edge.specifier].join(' -> '));
        } else if (next) visit(next, [...trail, next]);
      }
    }
    visit(start, []);
  }
  function walkFeature(feature, trail) {
    for (const next of featureEdges.get(feature) ?? []) {
      if (trail.includes(next)) errors.add(`Feature cycle: ${[...trail, next].join(' -> ')}`);
      else walkFeature(next, [...trail, next]);
    }
  }
  for (const feature of featureEdges.keys()) walkFeature(feature, [feature]);
  for (const entry of policy.entrypoints)
    if (!graph.has(entry)) errors.add(`Missing protected entrypoint: ${entry}`);
  for (const entry of policy.exceptions)
    if (!usedExceptions.has(entry.edge)) errors.add(`Stale exception: ${entry.edge}`);
  return [...errors].sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '../..');
  const policy = JSON.parse(readFileSync(path.join(import.meta.dirname, 'policy.json'), 'utf8'));
  if (!existsSync(path.join(root, 'src/features'))) throw new Error('Missing features directory');
  const graph = readGraph(root);
  const errors = checkGraph(graph, policy);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      `Architecture check passed (${graph.size} modules, ${policy.entrypoints.length} protected entrypoints).`
    );
}
