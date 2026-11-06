import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { loadEnvironment } from './load-env.mjs';

it('preserves inherited settings, then prefers local settings over base settings', () => {
  const root = mkdtempSync(join(tmpdir(), 'biwenger-env-'));
  try {
    const local = join(root, 'local');
    const base = join(root, 'base');
    writeFileSync(local, 'EXISTING=local\nLOCAL_ONLY=local\n');
    writeFileSync(base, 'EXISTING=base\nLOCAL_ONLY=base\nBASE_ONLY=base\n');
    const env = { ENV_LOCAL_FILE: local, ENV_FILE: base, EXISTING: 'inherited' };
    loadEnvironment(env);
    expect(env).toMatchObject({ EXISTING: 'inherited', LOCAL_ONLY: 'local', BASE_ONLY: 'base' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
