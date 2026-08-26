import { gunzipSync, gzipSync } from 'node:zlib';
import { sampleEmergentRun } from './emergent-simulation';
import type {
  EmergentCap15Analysis,
  EmergentConfigurationReport,
  EmergentRankingEntry,
  EmergentRunDetail,
  EmergentRunSample,
  EmergentRunSummary,
  EmergentSimulationConfig,
} from './emergent-types';
import type { SimulationDatasetIdentity } from './simulation-types';

const ROOT = 'season-review/v5';
const LATEST_KEY = `${ROOT}/latest.json`;

export interface ArtifactObjectStore {
  put(key: string, value: Uint8Array, contentType?: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
}

export interface EmergentCatalogEntry {
  config: EmergentSimulationConfig;
  sampleSize: number;
  reportKey: string | null;
  sampleKey: string | null;
}

export interface EmergentCatalog {
  version: 5;
  modelVersion: 'agent-season-v5';
  generationId: string;
  generatedAt: string;
  dataset: SimulationDatasetIdentity;
  baseRuns: number;
  finalistRuns: number;
  configurations: EmergentCatalogEntry[];
  ranking: EmergentRankingEntry[];
  cap15Analysis: EmergentCap15Analysis[];
}

export interface EmergentPublicCatalog {
  version: 5;
  modelVersion: 'agent-season-v5';
  generationId: string;
  generatedAt: string;
  dataset: SimulationDatasetIdentity;
  baseRuns: number;
  finalistRuns: number;
  configurations: Array<Pick<EmergentCatalogEntry, 'config' | 'sampleSize'>>;
  ranking: EmergentRankingEntry[];
  cap15Analysis: EmergentCap15Analysis[];
}

export function toPublicEmergentCatalog(catalog: EmergentCatalog): EmergentPublicCatalog {
  return {
    version: catalog.version,
    modelVersion: catalog.modelVersion,
    generationId: catalog.generationId,
    generatedAt: catalog.generatedAt,
    dataset: catalog.dataset,
    baseRuns: catalog.baseRuns,
    finalistRuns: catalog.finalistRuns,
    configurations: catalog.configurations.map(({ config, sampleSize }) => ({
      config,
      sampleSize,
    })),
    ranking: catalog.ranking,
    cap15Analysis: catalog.cap15Analysis || [],
  };
}

interface LatestManifest {
  version: 5;
  generationId: string;
  catalogKey: string;
}

function jsonBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value));
}

function parseJson<Value>(value: Uint8Array): Value {
  return JSON.parse(new TextDecoder().decode(value)) as Value;
}

function gzipJson(value: unknown) {
  return new Uint8Array(gzipSync(jsonBytes(value), { level: 9 }));
}

function parseGzipJson<Value>(value: Uint8Array): Value {
  return parseJson<Value>(new Uint8Array(gunzipSync(value)));
}

async function required(store: ArtifactObjectStore, key: string) {
  const value = await store.get(key);
  if (!value) throw new Error(`Missing V5 artifact: ${key}`);
  return value;
}

export async function publishEmergentGeneration(input: {
  store: ArtifactObjectStore;
  generationId: string;
  generatedAt: string;
  dataset: SimulationDatasetIdentity;
  reports: EmergentConfigurationReport[];
  runsByConfig: Map<string, EmergentRunDetail[]>;
  ranking: EmergentRankingEntry[];
  cap15Analysis?: EmergentCap15Analysis[];
  baseRuns: number;
  finalistRuns: number;
}) {
  const reports = new Map(input.reports.map((report) => [report.config.configId, report]));
  const configurations = new Map<string, EmergentSimulationConfig>();
  input.reports.forEach((report) => configurations.set(report.config.configId, report.config));
  input.runsByConfig.forEach((runs) => {
    const config = runs[0]?.config;
    if (config) configurations.set(config.configId, config);
  });

  const catalogEntries: EmergentCatalogEntry[] = [];
  for (const config of Array.from(configurations.values()).sort((left, right) =>
    left.configId.localeCompare(right.configId)
  )) {
    catalogEntries.push(
      await publishEmergentConfiguration({
        store: input.store,
        generationId: input.generationId,
        config,
        report: reports.get(config.configId) || null,
        runs: input.runsByConfig.get(config.configId) || [],
      })
    );
  }
  const catalog: EmergentCatalog = {
    version: 5,
    modelVersion: 'agent-season-v5',
    generationId: input.generationId,
    generatedAt: input.generatedAt,
    dataset: input.dataset,
    baseRuns: input.baseRuns,
    finalistRuns: input.finalistRuns,
    configurations: catalogEntries,
    ranking: input.ranking,
    cap15Analysis: input.cap15Analysis || [],
  };
  return publishEmergentCatalog(input.store, catalog);
}

export async function publishEmergentConfiguration(input: {
  store: ArtifactObjectStore;
  generationId: string;
  config: EmergentSimulationConfig;
  report: EmergentConfigurationReport | null;
  runs: EmergentRunDetail[];
}): Promise<EmergentCatalogEntry> {
  const prefix = `${ROOT}/generations/${input.generationId}`;
  const reportKey = input.report ? `${prefix}/reports/${input.config.configId}.json.gz` : null;
  const sampleKey = `${prefix}/samples/${input.config.configId}.json.gz`;
  if (input.report && reportKey)
    await input.store.put(
      reportKey,
      gzipJson({ ...input.report, runSummaries: [] }),
      'application/gzip'
    );
  await input.store.put(
    sampleKey,
    gzipJson(input.runs.map((run) => sampleEmergentRun(run))),
    'application/gzip'
  );
  return {
    config: input.config,
    sampleSize: input.report?.sampleSize || input.runs.length,
    reportKey,
    sampleKey,
  };
}

export class EmergentConfigurationArtifactWriter {
  private readonly prefix: string;

  constructor(
    private readonly store: ArtifactObjectStore,
    private readonly generationId: string,
    private readonly config: EmergentSimulationConfig
  ) {
    this.prefix = `${ROOT}/generations/${generationId}`;
  }

  append(run: EmergentRunDetail) {
    if (run.config.configId !== this.config.configId)
      throw new Error('Cannot mix configurations in one V5 artifact writer');
  }

  async finish(
    report: EmergentConfigurationReport,
    samples: EmergentRunSample[]
  ): Promise<EmergentCatalogEntry> {
    const reportKey = `${this.prefix}/reports/${this.config.configId}.json.gz`;
    const sampleKey = `${this.prefix}/samples/${this.config.configId}.json.gz`;
    await this.store.put(reportKey, gzipJson({ ...report, runSummaries: [] }), 'application/gzip');
    await this.store.put(sampleKey, gzipJson(samples), 'application/gzip');
    return {
      config: this.config,
      sampleSize: report.sampleSize,
      reportKey,
      sampleKey,
    };
  }
}

export async function publishEmergentCatalog(store: ArtifactObjectStore, catalog: EmergentCatalog) {
  const catalogKey = `${ROOT}/generations/${catalog.generationId}/catalog.json`;
  await store.put(catalogKey, jsonBytes(catalog), 'application/json');
  const latest: LatestManifest = {
    version: 5,
    generationId: catalog.generationId,
    catalogKey,
  };
  // This pointer is deliberately written last, making publication atomic for readers.
  await store.put(LATEST_KEY, jsonBytes(latest), 'application/json');
  return catalog;
}

export async function readEmergentRunSummaries(
  store: ArtifactObjectStore,
  entry: EmergentCatalogEntry
): Promise<EmergentRunSummary[]> {
  return (await readEmergentSamples(store, entry)).map((sample) => sample.summary);
}

export async function readEmergentSamples(
  store: ArtifactObjectStore,
  entry: EmergentCatalogEntry
): Promise<EmergentRunSample[]> {
  if (!entry.sampleKey) throw new Error(`Missing V5 samples for ${entry.config.configId}`);
  return parseGzipJson<EmergentRunSample[]>(await required(store, entry.sampleKey));
}

export class EmergentArtifactRepository {
  constructor(private readonly store: ArtifactObjectStore) {}

  async getCatalog(): Promise<EmergentCatalog> {
    const latestBytes = await this.store.get(LATEST_KEY);
    if (!latestBytes) throw new Error('No published V5 generation');
    const latest = parseJson<LatestManifest>(latestBytes);
    if (latest.version !== 5) throw new Error('Unsupported V5 manifest');
    return parseJson<EmergentCatalog>(await required(this.store, latest.catalogKey));
  }

  async getReport(configId: string): Promise<EmergentConfigurationReport | null> {
    const catalog = await this.getCatalog();
    const entry = catalog.configurations.find(
      (candidate) => candidate.config.configId === configId
    );
    if (!entry?.reportKey) return null;
    return parseGzipJson<EmergentConfigurationReport>(await required(this.store, entry.reportKey));
  }

  async listRuns(
    _configId: string,
    _options: { cursor?: string | null; limit?: number } = {}
  ): Promise<{ data: EmergentRunSummary[]; nextCursor: string | null; total: number }> {
    return { data: [], nextCursor: null, total: 0 };
  }

  async getRun(_configId: string, _runId: string): Promise<EmergentRunDetail | null> {
    return null;
  }
}
