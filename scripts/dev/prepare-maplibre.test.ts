import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('MapLibre security distribution', () => {
  it('pins an exact patched version in the manifest, lockfile and installation', () => {
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const installed = JSON.parse(readFileSync('node_modules/maplibre-gl/package.json', 'utf8'));
    const pinned = manifest.dependencies['maplibre-gl'];
    expect(pinned).toMatch(/^6\.\d+\.\d+$/);
    // 6.4.1 is the first release patched for GHSA-jrc7-96c5-q579.
    const [, minor, patch] = pinned.split('.').map(Number);
    expect(minor > 4 || (minor === 4 && patch >= 1)).toBe(true);
    expect(lock.packages['node_modules/maplibre-gl'].version).toBe(pinned);
    expect(installed.version).toBe(pinned);
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
    const destination = resolve('public/vendor/maplibre', manifest.dependencies['maplibre-gl']);
    for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
      expect(readFileSync(resolve(destination, file))).toEqual(
        readFileSync(resolve('node_modules/maplibre-gl/dist', file))
      );
    }
    expect(readFileSync(resolve(destination, 'LICENSE.txt'), 'utf8')).toContain('Copyright');
    // Since 6.18 the worker is self-contained; earlier releases import the shared module
    // relatively, which the copy loop above already guarantees is present.
  }, 15000);
});
