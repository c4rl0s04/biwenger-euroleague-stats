import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { readGraph } from './check.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const graph = readGraph(root, ['src', 'scripts']);
const retained = [...graph.keys()].filter(
  (file) =>
    /^src\/components\/ui\/(Card|Theme|card-variants\/)/.test(file) ||
    [
      'src/components/layout/Section.js',
      'src/components/mobile/MobileHeaderActions.tsx',
      'src/components/ui/UserAvatar.js',
      'src/contexts/CardThemeContext.js',
      'src/lib/utils/analytics.ts',
      'src/lib/constants/thresholds.js',
      'src/lib/mobile/screen-state.ts',
    ].includes(file)
);
const modules = retained.sort().map((file) => ({
  file,
  callers: [...graph]
    .filter(([, node]) => node.imports.some((edge) => edge.target === file))
    .map(([caller]) => caller)
    .sort(),
  owner: file.includes('Section')
    ? 'UI-01C shared composition / shell registration'
    : file.includes('MobileHeaderActions') ||
        file.includes('UserAvatar') ||
        file.includes('screen-state')
      ? 'UI-01C / UI-02 capability and state composition'
      : 'feature UI adoption / legacy theme compatibility',
  removalGate:
    'Review direct callers, barrel dispatch and test consumers together; no implicit API removal during reconciliation.',
}));
const tokens = new Map();
const add = (name, kind, file) => {
  if (!tokens.has(name)) tokens.set(name, { definitions: new Set(), references: new Set() });
  tokens.get(name)[kind].add(file);
};
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (
      !/\.(css|[jt]sx?)$/.test(entry.name) ||
      /\.(test|spec)\./.test(entry.name) ||
      full.includes('/__tests__/')
    )
      continue;
    const file = path.relative(root, full);
    const source = readFileSync(full, 'utf8');
    if (entry.name.endsWith('.css'))
      for (const match of source.matchAll(/(--[\w-]+)\s*:/g)) add(match[1], 'definitions', file);
    for (const match of source.matchAll(
      /var\(\s*(--[\w-]+)|(?:getPropertyValue|setProperty|removeProperty)\(\s*['"](--[\w-]+)/g
    ))
      add(match[1] || match[2], 'references', file);
  }
}
walk(path.join(root, 'src'));
console.log(
  JSON.stringify(
    {
      scope:
        'Static runtime callers and CSS custom-property definitions/references. Tailwind-generated utilities, computed class names and external assets require manual review; zero direct references is not deletion proof. No token values changed.',
      modules,
      tokens: Object.fromEntries(
        [...tokens]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, uses]) => [
            name,
            { definitions: [...uses.definitions].sort(), references: [...uses.references].sort() },
          ])
      ),
    },
    null,
    2
  )
);
