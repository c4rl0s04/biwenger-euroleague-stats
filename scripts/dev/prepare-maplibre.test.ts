import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('MapLibre security distribution', () => {
  it('pins the patched version in the manifest, lockfile and installation', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const installed = JSON.parse(readFileSync('node_modules/maplibre-gl/package.json', 'utf8'));
    expect(manifest.dependencies['maplibre-gl']).toBe('6.4.1');
    expect(lock.packages['node_modules/maplibre-gl'].version).toBe('6.4.1');
    expect(installed.version).toBe('6.4.1');
  });

  it('prepares the unmodified worker and its relative dependency for every supported build/dev entry', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    for (const hook of [
      'prebuild',
      'predev',
      'predev:worktree',
      'preanalyze',
      'pretest:e2e:local',
      'pretest:e2e:update',
    ]) {
      expect(manifest.scripts[hook]).toBe('node scripts/dev/prepare-maplibre.mjs');
    }
    execFileSync(process.execPath, ['scripts/dev/prepare-maplibre.mjs']);
    const destination = resolve('public/vendor/maplibre/6.4.1');
    for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
      expect(readFileSync(resolve(destination, file))).toEqual(
        readFileSync(resolve('node_modules/maplibre-gl/dist', file))
      );
    }
    expect(readFileSync(resolve(destination, 'LICENSE.txt'), 'utf8')).toContain('Copyright');
    const worker = readFileSync(resolve(destination, 'maplibre-gl-worker.mjs'), 'utf8');
    expect(worker).toContain('./maplibre-gl-shared.mjs');
  });
});
