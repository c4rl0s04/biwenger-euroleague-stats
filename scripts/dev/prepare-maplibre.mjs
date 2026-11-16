import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const packageDir = resolve(root, 'node_modules/maplibre-gl');
const { version } = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid MapLibre release version');
const destination = resolve(root, 'public/vendor/maplibre', version);
mkdirSync(destination, { recursive: true });
// Copy the installed, lockfile-pinned distribution verbatim, including license
// and source maps. No dependency scripts or external network requests run here.
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(resolve(packageDir, 'dist', file), resolve(destination, file));
}
// Source maps are optional: some releases (e.g. 6.18.0) ship no shared-module map.
for (const file of ['maplibre-gl-worker.mjs.map', 'maplibre-gl-shared.mjs.map']) {
  const source = resolve(packageDir, 'dist', file);
  if (existsSync(source)) copyFileSync(source, resolve(destination, file));
}
copyFileSync(resolve(packageDir, 'LICENSE.txt'), resolve(destination, 'LICENSE.txt'));
console.log(`Prepared local MapLibre ${version} worker assets.`);
