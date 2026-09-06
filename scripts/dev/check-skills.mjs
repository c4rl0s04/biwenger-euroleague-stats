import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const directory = path.join(root, '.agents/skills');
const errors = [];
let count = 0;
for (const entry of readdirSync(directory, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const base = path.join(directory, entry.name);
  const skill = path.join(base, 'SKILL.md');
  if (!existsSync(skill)) {
    errors.push(`${entry.name}: missing SKILL.md`);
    continue;
  }
  count++;
  const source = readFileSync(skill, 'utf8');
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
  if (!frontmatter || !/^name: .+/m.test(frontmatter) || !/^description: .+/m.test(frontmatter))
    errors.push(`${entry.name}: missing skill metadata`);
  if (!/^[a-z0-9-]+$/.test(entry.name)) errors.push(`${entry.name}: unsupported directory name`);
  const declaredName = /^name: (.+)$/m.exec(frontmatter ?? '')?.[1].replace(/^['"]|['"]$/g, '');
  if (declaredName !== entry.name) errors.push(`${entry.name}: name must match directory`);
  const checked = new Set();
  function checkMarkdown(file) {
    if (checked.has(file)) return;
    checked.add(file);
    const text = readFileSync(file, 'utf8');
    if (/~\/\.claude\/|AskUserQuestion|\[TODO[:\]]/.test(text))
      errors.push(`${path.relative(root, file)}: nonportable tool/path or unfinished placeholder`);
    for (const match of text.matchAll(/\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))\)/g)) {
      const link = match[1] ?? match[2];
      if (/^(https?:|mailto:|#)/.test(link)) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(link.split('#')[0]));
      if (!existsSync(target)) errors.push(`${path.relative(root, file)}: missing ${link}`);
      else if (
        target.startsWith(base + path.sep) &&
        target.endsWith('.md') &&
        statSync(target).isFile()
      )
        checkMarkdown(target);
    }
  }
  checkMarkdown(skill);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Skill check passed (${count} repository skills; metadata, local references, portability).`
  );
