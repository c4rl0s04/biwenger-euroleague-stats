import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';
import type { PoolClient } from 'pg';
import { prepareOfficialMappingMutations } from '../../src/lib/db/mutations/official/mappings';
import { readWebsiteBiography } from '../../src/lib/db/mutations/official/player-biographies';
import { createCliPool } from '../../src/lib/db/cli';
import {
  hash,
  SEASON,
  DEFAULT_COLLECTION_PATH,
  type Manifest,
  type Asset,
  collectionSchema,
  manifestSchema,
  normalize,
  teamLogoUrl,
} from './types';
import { validateImage } from './validate';

const { values } = parseArgs({
  options: {
    input: { type: 'string', default: DEFAULT_COLLECTION_PATH },
    'dry-run': { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
    manifest: { type: 'string' },
  },
});

type Row = Record<string, unknown>;

export async function snapshot(db: PoolClient) {
  const season = (await db.query('SELECT status FROM seasons WHERE id=$1', [SEASON])).rows[0];
  if (season?.status !== 'active') throw new Error(`${SEASON} must be active`);

  const teams = (
    await db.query(
      "SELECT to_jsonb(m) AS row FROM official_team_mappings m WHERE season_id=$1 AND provider='euroleague_advanced' ORDER BY id",
      [SEASON]
    )
  ).rows.map((r) => r.row as Row);

  const mappings = (
    await db.query(
      "SELECT to_jsonb(m) AS row FROM official_player_mappings m WHERE season_id=$1 AND provider='euroleague_advanced' ORDER BY id",
      [SEASON]
    )
  ).rows.map((r) => r.row as Row);

  const target = hash(
    (
      await db.query(
        'SELECT current_database() AS database, system_identifier::text FROM pg_control_system()'
      )
    ).rows[0]
  );

  return { teams, mappings, target };
}

export function preview(assets: Asset[], state: Awaited<ReturnType<typeof snapshot>>) {
  const entries: Omit<Manifest['entries'][number], 'validation'>[] = [];
  const unresolved: Manifest['unresolved'] = [];
  const playerUrlCounts = new Map<string, number>();
  for (const asset of assets) {
    if (asset.kind === 'player' && asset.url) {
      playerUrlCounts.set(asset.url, (playerUrlCounts.get(asset.url) ?? 0) + 1);
    }
  }

  const targets = new Set<string>();
  for (const asset of assets) {
    const candidates =
      asset.kind === 'player'
        ? state.mappings.filter((row) => row.provider_player_code === asset.code)
        : state.teams.filter(
            (row) =>
              row.provider_team_code === asset.code ||
              normalize(String(row.provider_name)) === normalize(asset.teamName || '')
          );
    if (candidates.length !== 1) {
      unresolved.push({
        name: asset.name,
        reason: `Official ${asset.kind} code ${asset.code} missing or ambiguous`,
      });
      continue;
    }

    const before = candidates[0];
    const code = asset.kind === 'player' ? asset.code : String(before.provider_team_code);
    const key = `${asset.kind}:${code}`;
    if (targets.has(key)) throw new Error(`Duplicate official asset: ${key}`);
    targets.add(key);

    const isPlaceholder =
      asset.kind === 'player' && asset.url && (playerUrlCounts.get(asset.url) ?? 0) > 1;
    entries.push({ ...asset, code, before, url: isPlaceholder ? null : asset.url });
  }

  return { entries, unresolved };
}

export async function applyManifest(db: PoolClient, manifest: Manifest, digest: string) {
  if (hash(manifest) !== digest) throw new Error('Manifest digest mismatch');
  await db.query('BEGIN');
  try {
    await db.query("SET LOCAL lock_timeout='5s'");
    for (const key of [823744, 823745]) {
      if (
        !(await db.query('SELECT pg_try_advisory_xact_lock($1) AS locked', [key])).rows[0].locked
      ) {
        throw new Error('A synchronization or import is already running under advisory lock');
      }
    }

    await db.query(
      'LOCK TABLE seasons, official_player_mappings, official_team_mappings IN SHARE ROW EXCLUSIVE MODE'
    );

    const state = await snapshot(db);
    if (state.target !== manifest.target) throw new Error('Database target fingerprint mismatch');

    const mutations = prepareOfficialMappingMutations(db, manifest.season);
    let updatedPortraits = 0;
    let updatedCrests = 0;
    let storedBiographies = 0;
    for (const entry of manifest.entries) {
      const imageUrl = entry.validation ? entry.url : null;
      const provenance = {
        source: 'euroleague_website',
        page: entry.page,
        collected_at: manifest.collectedAt,
        manifest: digest,
      };
      if (entry.kind === 'player') {
        const biography = readWebsiteBiography({
          country: entry.country,
          birth_date: entry.birthDate,
          height: entry.height,
          weight: entry.weight,
        });
        const hasBiography = Object.keys(biography).length > 0;
        if (!imageUrl && !hasBiography) continue;
        await mutations.updateWebsitePlayer(entry.code, imageUrl, provenance, biography);
        if (imageUrl) updatedPortraits++;
        if (hasBiography) storedBiographies++;
      } else if (imageUrl) {
        const result = await db.query(
          `UPDATE official_team_mappings
           SET crest_url = $1,
               raw_payload = COALESCE(NULLIF(raw_payload, 'null'::jsonb), '{}'::jsonb) ||
                 jsonb_build_object('website_image', $2::jsonb),
               updated_at = NOW()
           WHERE season_id = $3 AND provider = 'euroleague_advanced' AND provider_team_code = $4`,
          [imageUrl, JSON.stringify(provenance), manifest.season, entry.code]
        );
        if (result.rowCount !== 1) throw new Error(`Official team missing: ${entry.code}`);
        updatedCrests++;
      }
    }

    await db.query('COMMIT');
    return { updatedPortraits, updatedCrests, storedBiographies };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const isDryRun = values['dry-run'];
  const isApply = values.apply;

  if (!isDryRun && !isApply) {
    console.log('Usage:');
    console.log('  Preview / Dry-Run: npx tsx scripts/euroleague/sync.ts --dry-run');
    console.log('  Apply to DB:       npx tsx scripts/euroleague/sync.ts --apply');
    return;
  }

  const inputRaw = await readFile(values.input!, 'utf8');
  const collection = collectionSchema.parse(JSON.parse(inputRaw));

  dotenv.config({ path: ['.env.local', '.env'], quiet: true });
  const pool = createCliPool({ max: 1 });
  const db = await pool.connect();

  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const state = await snapshot(db);
    await db.query('COMMIT');

    const plan = preview(collection.assets, state);
    plan.unresolved.push(...collection.missing);

    console.log(`\nValidating image assets via CDN...`);
    const entries = [];
    for (const entry of plan.entries) {
      if (entry.url) {
        try {
          const url = entry.kind === 'team' ? teamLogoUrl(entry.url) : entry.url;
          const val = await validateImage(url, entry.kind);
          entries.push({ ...entry, url, validation: val });
        } catch {
          if (entry.kind === 'team')
            console.warn(
              `Team logo validation failed for ${entry.name}; preserving existing logo.`
            );
          // Preserve the stored image when validation fails.
          entries.push({ ...entry, url: null, validation: null });
        }
      } else {
        entries.push({ ...entry, validation: null });
      }
    }

    const manifest = manifestSchema.parse({
      version: 1,
      season: SEASON,
      collectedAt: collection.collectedAt,
      target: state.target,
      entries,
      unresolved: plan.unresolved,
    });

    const digest = hash(manifest);
    const playerEntries = entries.filter((e) => e.kind === 'player');
    const teamEntries = entries.filter((e) => e.kind === 'team');
    const realPhotos = playerEntries.filter((e) => e.url !== null);
    console.log('\n============================================================');
    console.log(`          EUROLEAGUE SYNC REPORT (${SEASON})`);
    console.log('============================================================');
    console.log(
      `Roster Assets Ready:        ${entries.length} (${playerEntries.length} players, ${teamEntries.length} teams)`
    );
    console.log(`Real Photoshoot Portraits:  ${realPhotos.length}`);
    console.log(`Players without validated portraits: ${playerEntries.length - realPhotos.length}`);
    console.log(`Unresolved assets: ${plan.unresolved.length}`);
    for (const { name, reason } of plan.unresolved) console.log(`  • ${name}: ${reason}`);
    console.log(`Manifest SHA-256 Digest:    ${digest}`);
    console.log('============================================================\n');

    if (isDryRun) {
      const manifestPath = values.manifest || '/tmp/euroleague-preview-manifest.json';
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`[DRY-RUN] Manifest saved to: ${manifestPath}`);
      console.log(`[DRY-RUN] Zero database changes were written.\n`);
      return;
    }

    if (isApply) {
      console.log('🚀 Applying changes to PostgreSQL database in an atomic transaction...');
      const result = await applyManifest(db, manifest, digest);
      console.log('\n✅ TRANSACTION COMMITTED SUCCESSFULLY!');
      console.log(`   Updated official portraits: ${result.updatedPortraits}`);
      console.log(`   Stored official biographies: ${result.storedBiographies}`);
      console.log(`   Updated official crests:    ${result.updatedCrests}\n`);
    }
  } finally {
    db.release();
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('sync.ts')) {
  main().catch((err) => {
    console.error('Synchronization failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
