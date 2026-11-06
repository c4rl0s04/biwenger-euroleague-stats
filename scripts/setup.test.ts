import { spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'biwenger-setup-'));
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'src/lib/db'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  copyFileSync('scripts/setup.js', join(root, 'scripts/setup.js'));
  copyFileSync('src/lib/db/connection-config.ts', join(root, 'src/lib/db/connection-config.ts'));
  return root;
}
function run(root: string, replies: Array<[string, string]> = []) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, 'scripts/setup.js')], {
      cwd: root,
      stdio: 'pipe',
    });
    let output = '';
    let next = 0;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Setup fixture timed out'));
    }, 8000);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      if (next < replies.length && output.includes(replies[next][0]))
        child.stdin.write(replies[next++][1] + '\n');
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}
describe('setup creates new configuration safely', () => {
  it('writes minimal configuration without displaying credentials', async () => {
    const root = fixture();
    const url = 'postgresql://fixture:synthetic-password@localhost/setup_fixture';
    try {
      const result = await run(root, [
        ['DATABASE_URL:', url],
        ['account linking?', 'y'],
        ['Background BIWENGER_TOKEN', 'synthetic-ingestion'],
        ['AI provider (', ''],
      ]);
      expect(result.code).toBe(0);
      expect(result.output).not.toContain(url);
      expect(result.output).not.toContain('synthetic-ingestion');
      const content = readFileSync(join(root, '.env'), 'utf8');
      expect(content).toContain('BIWENGER_CREDENTIAL_KEYS=');
      expect(content).not.toContain('SEASON_ID');
      expect(content).not.toContain('ACCESS_PASSWORD');
      expect(statSync(join(root, '.env')).mode & 0o777).toBe(0o600);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it('refuses to replace an existing keyring or environment file', async () => {
    const root = fixture();
    try {
      writeFileSync(join(root, '.env'), 'sentinel');
      expect((await run(root)).code).toBe(1);
      expect(readFileSync(join(root, '.env'), 'utf8')).toBe('sentinel');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  it('does not write partial settings after an invalid database URL', async () => {
    const root = fixture();
    try {
      const result = await run(root, [['DATABASE_URL:', 'invalid-fixture-url']]);
      expect(result.code).toBe(1);
      expect(result.output).not.toContain('invalid-fixture-url');
      expect(existsSync(join(root, '.env'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
