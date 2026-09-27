import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readGraph } from './check.mjs';

function exportedNames(root, file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(path.join(root, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  const names = [];
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause))
        names.push(...node.exportClause.elements.map((item) => item.name.text));
      else names.push(`* from ${node.moduleSpecifier?.getText(source) ?? 'namespace'}`);
    } else if (ts.isExportAssignment(node)) names.push('default');
    else if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (node.name) names.push(node.name.getText(source));
      if (ts.isVariableStatement(node))
        names.push(...node.declarationList.declarations.map((item) => item.name.getText(source)));
    }
  }
  return names.sort();
}

export function classifyModule(file) {
  if (!file.includes('/'))
    return {
      owner: 'framework/tool configuration',
      disposition: 'retained shared infrastructure',
      contract: 'build, monitoring or test-tool entrypoint; preserve configuration',
      verification: 'full verify and browser runner',
      blocker: null,
    };
  const feature = /^src\/features\/([^/]+)\//.exec(file)?.[1];
  if (feature)
    return {
      owner: feature,
      disposition: 'feature-owned',
      contract: file.endsWith('/public.ts')
        ? 'client-safe public contract'
        : file.endsWith('/server.ts')
          ? 'server-only contract'
          : 'feature internal; consume public/server across features',
      verification: `src/features/${feature}`,
      blocker: null,
    };
  if (file.startsWith('src/lib/logic/') || file === 'src/lib/utils/fantasy-scoring.ts')
    return {
      owner: 'shared competition calculations',
      disposition: 'retained shared infrastructure',
      contract:
        'pure competition calculations; fantasy-scoring is a test-covered reference with no current runtime callers',
      verification: 'logic and consuming feature suites',
      blocker: null,
    };
  if (file === 'src/lib/services/app/appShellService.ts')
    return {
      owner: 'application-shell',
      disposition: 'temporary adapter',
      contract: 'request-scoped standings and season context',
      verification: 'request-standings and shell suites',
      blocker: '25B / Tasks 23–24 integration',
    };
  if (file === 'src/lib/db/queries/core/playerForm.ts')
    return {
      owner: 'shared competition reads',
      disposition: 'retained shared infrastructure',
      contract:
        'typed season-scoped PlayerFormEntry map; finished matches; zero/DNP/unknown semantics',
      verification: 'playerForm, player-form-ranking, captain and Team contracts',
      blocker: null,
    };
  if (file === 'src/lib/db/queries/core/manager-directory.ts')
    return {
      owner: 'shared competition reads',
      disposition: 'retained shared infrastructure',
      contract: 'active-season id/name/icon/color projection; avoids feature dependency cycle',
      verification: 'manager-directory contracts',
      blocker: null,
    };
  if (
    file === 'src/auth.js' ||
    file === 'src/auth.config.js' ||
    file.startsWith('src/lib/auth/') ||
    file.startsWith('src/lib/credentials/') ||
    file === 'src/lib/db/queries/core/users.ts'
  )
    return {
      owner: 'authentication/credentials',
      disposition: 'retained shared infrastructure',
      contract: 'existing credential and authentication behavior frozen',
      verification: 'accounts, provider, credentials and auth tests',
      blocker: 'separate authentication/security gate',
    };
  if (file.startsWith('scripts/') || file.startsWith('src/lib/sync/'))
    return {
      owner: file.startsWith('src/lib/sync/')
        ? 'sync operations'
        : `operations/${file.split('/')[1]}`,
      disposition: 'retained shared infrastructure',
      contract: 'CLI/operational entrypoint or helper; not an application feature boundary',
      verification: 'operational unit suites; no production commands during closure',
      blocker: null,
    };
  if (file.startsWith('src/app/api/'))
    return {
      owner: 'HTTP adapter',
      disposition: 'feature-owned',
      contract: 'preserved URL/status/envelope/auth/cache; owning feature imports listed below',
      verification: 'API contract suites',
      blocker: null,
    };
  if (
    file === 'public/sw.js' ||
    file.startsWith('src/components/') ||
    file.startsWith('src/hooks/') ||
    file.startsWith('src/app/') ||
    file.startsWith('src/styles/') ||
    file.startsWith('src/contexts/') ||
    file === 'src/lib/utils/analytics.ts' ||
    file.startsWith('src/lib/constants/') ||
    /^src\/lib\/(mobile|theme|pwa|hooks)\//.test(file)
  )
    return {
      owner: 'UI migration',
      disposition: 'UI-owned',
      contract: 'preserve rendering, navigation and interaction',
      verification: 'Tasks 23–24 visual/interaction acceptance',
      blocker: '25B / Tasks 23–24 integration',
    };
  return {
    owner: `shared/${file.split('/')[2] ?? 'framework'}`,
    disposition: 'retained shared infrastructure',
    contract: 'shared runtime support; imports and exports inventoried below',
    verification: 'full verify and owning infrastructure suites',
    blocker: null,
  };
}

export function createInventory(root) {
  const rootModules = readdirSync(root).filter(
    (file) => /\.[cm]?[jt]sx?$/.test(file) && !file.endsWith('.d.ts')
  );
  const graph = readGraph(root, ['src', 'scripts', ...rootModules, 'public/sw.js']);
  const policy = JSON.parse(
    readFileSync(path.join(root, 'scripts/architecture/policy.json'), 'utf8')
  );
  const callers = new Map();
  for (const [file, node] of graph)
    for (const edge of node.imports) {
      if (!edge.target) continue;
      if (!callers.has(edge.target)) callers.set(edge.target, new Set());
      callers.get(edge.target).add(file);
    }
  const modules = [...graph]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, node]) => ({
      file,
      exports: exportedNames(root, file),
      ...classifyModule(file),
      callers: [...(callers.get(file) ?? [])].sort(),
      imports: node.imports,
      computedImports: node.computedImports,
    }));
  const entrypoints = modules
    .filter(
      ({ file }) =>
        /\/(page|layout|route)\.[jt]sx?$/.test(file) ||
        /\/actions\.[jt]s$/.test(file) ||
        /^(src\/(auth|proxy|instrumentation)|scripts\/)/.test(file) ||
        !file.includes('/') ||
        file === 'public/sw.js'
    )
    .map(({ file }) => ({
      file,
      protected: policy.entrypoints.includes(file),
      rationale: policy.entrypoints.includes(file)
        ? 'application feature boundary enforced'
        : file.includes('/api/auth/') || file === 'src/auth.js'
          ? 'authentication protocol; separate security gate'
          : file.includes('/api/health/')
            ? 'operational health endpoint intentionally accesses database health infrastructure'
            : file.startsWith('scripts/')
              ? 'operational command/helper; inventory only, feature rules do not govern operational database work'
              : file.startsWith('src/app/')
                ? 'UI/framework adapter; reconcile with Tasks 23–24 in 25B'
                : 'framework infrastructure',
    }));
  const packageCommands = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;
  const workflows = readdirSync(path.join(root, '.github/workflows'))
    .filter((file) => /\.ya?ml$/.test(file))
    .sort()
    .map((file) => ({
      file: `.github/workflows/${file}`,
      content: readFileSync(path.join(root, '.github/workflows', file), 'utf8'),
    }));
  return {
    scope:
      'src, scripts, root configuration and public/sw.js static imports, re-exports, literal import()/require(); package commands and full workflow command definitions. Unresolved/computed references require manual review. Tests are verified separately, not counted as runtime callers.',
    moduleCount: modules.length,
    protectedEntrypoints: policy.entrypoints.length,
    exceptions: policy.exceptions,
    entrypoints,
    packageCommands,
    workflows,
    unresolvedDynamic: modules.filter((m) => m.computedImports).map((m) => m.file),
    modules,
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(createInventory(path.resolve(import.meta.dirname, '../..')), null, 2));
}
