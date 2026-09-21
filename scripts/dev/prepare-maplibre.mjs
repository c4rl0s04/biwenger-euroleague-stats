import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const packageDir = resolve(root, 'node_modules/maplibre-gl');
const { version } = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid MapLibre release version');
const destination = resolve(root, 'public/vendor/maplibre', version);
mkdirSync(destination, { recursive: true });
// Copy the installed, lockfile-pinned distribution verbatim, including license
// and source maps. No dependency scripts or external network requests run here.
for (const file of [
  'maplibre-gl-worker.mjs',
  'maplibre-gl-shared.mjs',
  'maplibre-gl-worker.mjs.map',
  'maplibre-gl-shared.mjs.map',
]) {
  copyFileSync(resolve(packageDir, 'dist', file), resolve(destination, file));
}
copyFileSync(resolve(packageDir, 'LICENSE.txt'), resolve(destination, 'LICENSE.txt'));
console.log(`Prepared local MapLibre ${version} worker assets.`);
