import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { EmergentCatalog } from '../../src/lib/season-review/emergent-artifacts';

const sourceRoot = resolve(
  process.env.EMERGENT_ARTIFACT_ROOT || join(process.cwd(), 'artifacts', 'emergent-store')
);
const outputRoot = resolve(
  process.env.EMERGENT_BUNDLE_ROOT || join(process.cwd(), 'data', 'season-review-v5-store')
);
const latestKey = 'season-review/v5/latest.json';

async function readJson<Value>(key: string): Promise<Value> {
  return JSON.parse(await readFile(join(sourceRoot, key), 'utf8')) as Value;
}

async function writeJson(key: string, value: unknown) {
  const destination = join(outputRoot, key);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(value));
}

async function copyArtifact(key: string) {
  const destination = join(outputRoot, key);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(sourceRoot, key), destination);
}

const latest = await readJson<{ version: 5; generationId: string; catalogKey: string }>(latestKey);
const catalog = await readJson<EmergentCatalog>(latest.catalogKey);

for (const entry of catalog.configurations) {
  if (!entry.reportKey) throw new Error(`Missing aggregate report for ${entry.config.configId}`);
  await copyArtifact(entry.reportKey);
}

const aggregateCatalog: EmergentCatalog = {
  ...catalog,
  configurations: catalog.configurations.map((entry) => ({ ...entry, sampleKey: null })),
};

await writeJson(latest.catalogKey, aggregateCatalog);
await writeJson(latestKey, latest);

console.log(
  `Exported ${aggregateCatalog.configurations.length} aggregate reports to ${outputRoot}`
);
