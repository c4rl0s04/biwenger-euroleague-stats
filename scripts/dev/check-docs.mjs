import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const docsRoot = join(repositoryRoot, 'docs');
const requiredFrontmatter = ['title', 'description', 'audience', 'status'];
const acceptedAudiences = new Set([
  'newcomer',
  'contributor',
  'maintainer',
  'operator',
  'agent',
  'user',
]);
const acceptedStatuses = new Set(['active', 'draft', 'deprecated']);
const ignoredSchemes = /^(?:https?:|mailto:|tel:|data:|app:)/i;

function walkMarkdown(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(absolutePath);
    return entry.isFile() && extname(entry.name).toLowerCase() === '.md' ? [absolutePath] : [];
  });
}

function displayPath(path) {
  return relative(repositoryRoot, path).split(sep).join('/');
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const closingIndex = content.indexOf('\n---\n', 4);
  if (closingIndex === -1) return null;

  const lines = content.slice(4, closingIndex).split('\n');
  const values = new Map();
  let currentKey = null;

  for (const line of lines) {
    const keyMatch = line.match(/^([a-z][a-z0-9_-]*):(?:\s*(.*))?$/i);
    if (keyMatch) {
      currentKey = keyMatch[1];
      values.set(currentKey, keyMatch[2]?.trim() || []);
      continue;
    }

    const listMatch = line.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey) {
      const current = values.get(currentKey);
      if (Array.isArray(current)) current.push(listMatch[1].trim());
    }
  }

  return values;
}

function extractLinks(content) {
  const links = [];
  const markdownLink = /!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\)/g;
  let match;

  while ((match = markdownLink.exec(content)) !== null) {
    links.push((match[1] || match[2]).trim());
  }

  return links;
}

function resolveLocalLink(sourcePath, destination) {
  if (!destination || destination.startsWith('#') || destination.startsWith('/')) return null;
  if (ignoredSchemes.test(destination)) return null;

  const [rawPath] = destination.split('#', 1);
  if (!rawPath) return null;

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return { error: `contains invalid URL encoding: ${destination}` };
  }

  const absolutePath = resolve(dirname(sourcePath), decodedPath);
  const outsideRepository =
    absolutePath !== repositoryRoot && !absolutePath.startsWith(`${repositoryRoot}${sep}`);

  if (outsideRepository) {
    return { error: `escapes the repository: ${destination}` };
  }

  if (!existsSync(absolutePath)) {
    return { error: `does not exist: ${destination}` };
  }

  return { absolutePath };
}

const docsFiles = walkMarkdown(docsRoot);
const checkedMarkdown = [
  join(repositoryRoot, 'README.md'),
  join(repositoryRoot, '.agents/INSTRUCTIONS.md'),
  ...docsFiles,
];
const errors = [];
const docsLinks = new Map(docsFiles.map((file) => [file, new Set()]));

for (const file of docsFiles) {
  const content = readFileSync(file, 'utf8');
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    errors.push(`${displayPath(file)}: missing or malformed YAML frontmatter`);
    continue;
  }

  for (const field of requiredFrontmatter) {
    const value = frontmatter.get(field);
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push(`${displayPath(file)}: missing frontmatter field "${field}"`);
    }
  }

  const audiences = frontmatter.get('audience');
  if (!Array.isArray(audiences)) {
    errors.push(`${displayPath(file)}: "audience" must be a YAML list`);
  } else {
    for (const audience of audiences) {
      if (!acceptedAudiences.has(audience)) {
        errors.push(`${displayPath(file)}: unsupported audience "${audience}"`);
      }
    }
  }

  const status = frontmatter.get('status');
  if (typeof status === 'string') {
    const normalizedStatus = status.replace(/^['"]|['"]$/g, '');
    if (!acceptedStatuses.has(normalizedStatus)) {
      errors.push(`${displayPath(file)}: unsupported status "${normalizedStatus}"`);
    }
  }
}

for (const file of checkedMarkdown) {
  const content = readFileSync(file, 'utf8');
  for (const destination of extractLinks(content)) {
    const result = resolveLocalLink(file, destination);
    if (!result) continue;
    if (result.error) {
      errors.push(`${displayPath(file)}: ${result.error}`);
      continue;
    }

    if (docsLinks.has(file) && docsLinks.has(result.absolutePath)) {
      docsLinks.get(file).add(result.absolutePath);
    }

    if (statSync(result.absolutePath).isDirectory()) {
      // Source-code directory links are valid. Documentation navigation should point to a note.
      if (result.absolutePath.startsWith(`${docsRoot}${sep}`)) {
        errors.push(
          `${displayPath(file)}: documentation link must target a Markdown file: ${destination}`
        );
      }
    }
  }
}

const caseFoldedPaths = new Map();
for (const file of docsFiles) {
  const normalized = displayPath(file).toLowerCase();
  const existing = caseFoldedPaths.get(normalized);
  if (existing) errors.push(`${displayPath(file)}: path collides with ${existing}`);
  caseFoldedPaths.set(normalized, displayPath(file));
}

const vaultHome = join(docsRoot, 'README.md');
const reachable = new Set([vaultHome]);
const pending = [vaultHome];

while (pending.length > 0) {
  const current = pending.pop();
  for (const linked of docsLinks.get(current) || []) {
    if (!reachable.has(linked)) {
      reachable.add(linked);
      pending.push(linked);
    }
  }
}

for (const file of docsFiles) {
  if (!reachable.has(file)) {
    errors.push(`${displayPath(file)}: not reachable from docs/README.md`);
  }
}

if (errors.length > 0) {
  console.error(`Documentation check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation check passed for ${docsFiles.length} vault notes.`);
