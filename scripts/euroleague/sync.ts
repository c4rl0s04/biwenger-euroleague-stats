import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';
import type { PoolClient } from 'pg';
import { createCliPool } from '../../src/lib/db/cli';
import {
  hash,
  SEASON,
  DEFAULT_COLLECTION_PATH,
  type Candidate,
  type Mapping,
  type Manifest,
  type Asset,
  collectionSchema,
  manifestSchema,
  normalize,
} from './types';
import { matchPlayer, loadOverrides } from './match';
import { validateImage } from './validate';

const { values } = parseArgs({
  options: {
    input: { type: 'string', default: DEFAULT_COLLECTION_PATH },
    'dry-run': { type: 'boolean', default: false },
    apply: { type: 'boolean', default: false },
    interactive: { type: 'boolean', default: false },
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

  const players = (
    await db.query(
      `SELECT
         p.id,
         p.name,
         p.euroleague_code AS "euroleagueCode",
         p.country,
         p.birth_date AS "birthDate",
         p.height,
         p.weight,
         p.profile_url AS "profileUrl",
         m.provider_team_code AS "teamCode"
       FROM players p
       JOIN player_seasons ps ON ps.player_id=p.id
       LEFT JOIN official_team_mappings m ON m.team_id=ps.team_id AND m.season_id=ps.season_id AND m.provider='euroleague_advanced'
       WHERE ps.season_id=$1`,
      [SEASON]
    )
  ).rows as Candidate[];

  const target = hash(
    (
      await db.query(
        'SELECT current_database() AS database, system_identifier::text FROM pg_control_system()'
      )
    ).rows[0]
  );

  return { teams, mappings, players, target };
}

export async function preview(
  assets: Asset[],
  state: Awaited<ReturnType<typeof snapshot>>,
  options: { interactive?: boolean } = {}
) {
  const entries: Omit<Manifest['entries'][number], 'validation'>[] = [];
  const unresolved: Manifest['unresolved'] = [];
  const overrides = await loadOverrides();

  // 1. Detect generic silhouette placeholder URLs shared by multiple players
  const playerUrlCounts = new Map<string, number>();
  for (const a of assets) {
    if (a.kind === 'player' && a.url) {
      playerUrlCounts.set(a.url, (playerUrlCounts.get(a.url) || 0) + 1);
    }
  }

  for (const rawAsset of assets) {
    // If the image is a shared placeholder (silhouette), set url to null so Biwenger photo is preserved
    const isSharedPlaceholder =
      rawAsset.kind === 'player' &&
      rawAsset.url !== null &&
      (playerUrlCounts.get(rawAsset.url) || 0) > 1;

    const asset: Asset = {
      ...rawAsset,
      url: isSharedPlaceholder ? null : rawAsset.url,
    };

    const teams = state.teams.filter(
      (t) =>
        String(t.provider_team_code).toUpperCase() === asset.teamCode ||
        normalize(String(t.provider_name)) === normalize(asset.teamName || '')
    );

    if (teams.length !== 1) {
      unresolved.push({ name: asset.name, reason: 'Official team match missing or ambiguous' });
      continue;
    }

    const team = teams[0];
    const teamCode = String(team.provider_team_code);

    const match =
      asset.kind === 'team'
        ? { id: Number(team.team_id), method: 'existing_mapping' }
        : await matchPlayer(
            { ...asset, teamCode },
            state.players,
            state.mappings as unknown as Mapping[],
            { interactive: options.interactive, overrides }
          );

    if (!match) {
      unresolved.push({ name: asset.name, reason: 'Player mapping requires review' });
      continue;
    }

    const before =
      asset.kind === 'team'
        ? team
        : state.mappings.find((m) => m.provider_player_code === asset.code) || null;

    entries.push({
      ...asset,
      code: asset.kind === 'team' ? teamCode : asset.code,
      teamCode,
      targetId: match.id,
      method: match.method,
      before,
    });
  }

  const ids = new Set<string>();
  for (const e of entries) {
    const key = e.kind + e.targetId;
    if (ids.has(key))
      throw new Error(`Duplicate target ID in preview: ${e.name} (ID: ${e.targetId})`);
    ids.add(key);
  }

  for (const player of state.players) {
    if (!ids.has('player' + player.id)) {
      unresolved.push({
        name: player.name,
        reason: 'Database player not on official EuroLeague website roster',
      });
    }
  }

  return { entries, unresolved };
}

export async function applyManifest(db: PoolClient, manifest: Manifest, digest: string) {
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
      'LOCK TABLE seasons, player_seasons, players, official_player_mappings, official_team_mappings IN SHARE ROW EXCLUSIVE MODE'
    );

    const state = await snapshot(db);
    if (state.target !== manifest.target) throw new Error('Database target fingerprint mismatch');

    let updatedPlayersCount = 0;
    let updatedMappingsCount = 0;

    for (const e of manifest.entries) {
      if (e.kind === 'player') {
        // 1. Update players table: populate NULL fields only (preserve existing)
        const res = await db.query(
          `UPDATE players
           SET euroleague_code = COALESCE(euroleague_code, $1),
               profile_url = COALESCE(NULLIF(TRIM(profile_url), ''), $2),
               country = COALESCE(country, $3),
               birth_date = COALESCE(birth_date, $4),
               height = COALESCE(height, $5)
           WHERE id = $6`,
          [e.code, e.page, e.country || null, e.birthDate || null, e.height || null, e.targetId]
        );
        if (res.rowCount && res.rowCount > 0) updatedPlayersCount++;

        // 2. Prepare provenance & profile snapshot
        const provenance = e.url
          ? {
              source: 'euroleague_website',
              page: e.page,
              collected_at: manifest.collectedAt,
              manifest: digest,
            }
          : null;

        const profilePayload = {
          code: e.code,
          name: e.name,
          team_code: e.teamCode,
          page: e.page,
          country: e.country ?? null,
          birth_date: e.birthDate ?? null,
          height: e.height ?? null,
          dorsal: e.dorsal ?? null,
          position: e.position ?? null,
        };

        const currentMapping = state.mappings.find((m) => m.provider_player_code === e.code);

        if (currentMapping) {
          await db.query(
            `UPDATE official_player_mappings
             SET player_id = $1,
                 image_url = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE image_url END,
                 status = 'matched',
                 confidence = 1,
                 raw_payload = COALESCE(raw_payload, '{}'::jsonb) ||
                   jsonb_build_object(
                     'website_profile', $3::jsonb,
                     'website_image', CASE WHEN $4::text IS NOT NULL THEN $4::jsonb ELSE (raw_payload->'website_image') END
                   ),
                 updated_at = NOW()
             WHERE id = $5 AND season_id = $6`,
            [
              e.targetId,
              e.url,
              JSON.stringify(profilePayload),
              provenance ? JSON.stringify(provenance) : null,
              currentMapping.id,
              SEASON,
            ]
          );
        } else {
          await db.query(
            `INSERT INTO official_player_mappings (
               season_id, player_id, provider, provider_player_code, provider_name, provider_team_code,
               image_url, match_method, confidence, status, raw_payload
             ) VALUES (
               $1, $2, 'euroleague_advanced', $3, $4, $5, $6, $7, 1, 'matched',
               jsonb_build_object(
                 'website_profile', $8::jsonb,
                 'website_image', CASE WHEN $9::text IS NOT NULL THEN $9::jsonb ELSE NULL END
               )
             )`,
            [
              SEASON,
              e.targetId,
              e.code,
              e.name,
              e.teamCode,
              e.url,
              'website_' + e.method,
              JSON.stringify(profilePayload),
              provenance ? JSON.stringify(provenance) : null,
            ]
          );
        }
        updatedMappingsCount++;
      } else {
        // Team mapping
        const provenance = JSON.stringify({
          source: 'euroleague_website',
          page: e.page,
          collected_at: manifest.collectedAt,
          manifest: digest,
        });

        await db.query(
          `UPDATE official_team_mappings
           SET crest_url = COALESCE($1, crest_url),
               raw_payload = COALESCE(raw_payload, '{}'::jsonb) || jsonb_build_object('website_image', $2::jsonb),
               updated_at = NOW()
           WHERE team_id = $3 AND season_id = $4`,
          [e.url, provenance, e.targetId, SEASON]
        );
      }
    }

    await db.query('COMMIT');
    return {
      success: true,
      updatedPlayers: updatedPlayersCount,
      updatedMappings: updatedMappingsCount,
      totalEntries: manifest.entries.length,
    };
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
    console.log(
      '  Preview / Dry-Run: npx tsx scripts/euroleague/sync.ts --dry-run [--interactive]'
    );
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

    const plan = await preview(collection.assets, state, {
      interactive: values.interactive,
    });
    plan.unresolved.push(...collection.missing);

    console.log(`\nValidating image assets via CDN...`);
    const entries = [];
    for (const entry of plan.entries) {
      if (entry.url) {
        try {
          const val = await validateImage(entry.url);
          entries.push({ ...entry, validation: val });
        } catch {
          // If image fails, keep player entry but set url = null
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
    const placeholderSilhouettes = playerEntries.filter((e) => e.url === null);

    // Compute field fill counts
    let fillCodeCount = 0;
    let fillCountryCount = 0;
    let fillBirthDateCount = 0;
    let fillHeightCount = 0;
    let fillProfileUrlCount = 0;

    for (const pe of playerEntries) {
      const dbCandidate = state.players.find((p) => p.id === pe.targetId);
      if (dbCandidate) {
        if (!dbCandidate.euroleagueCode && pe.code) fillCodeCount++;
        if (!dbCandidate.country && pe.country) fillCountryCount++;
        if (!dbCandidate.birthDate && pe.birthDate) fillBirthDateCount++;
        if (!dbCandidate.height && pe.height) fillHeightCount++;
        if (!dbCandidate.profileUrl && pe.page) fillProfileUrlCount++;
      }
    }

    console.log('\n============================================================');
    console.log(`          EUROLEAGUE SYNC REPORT (${SEASON})`);
    console.log('============================================================');
    console.log(
      `Roster Assets Ready:        ${entries.length} (${playerEntries.length} players, ${teamEntries.length} teams)`
    );
    console.log(`Real Photoshoot Portraits:  ${realPhotos.length}`);
    console.log(
      `Biwenger Photo Fallbacks:   ${placeholderSilhouettes.length} (generic silhouette placeholders filtered)`
    );
    console.log(`Unresolved / Non-Roster:    ${plan.unresolved.length}`);
    console.log('------------------------------------------------------------');
    console.log('DURABLE BIO ENRICHMENTS (missing fields to be populated):');
    console.log(`  • Missing EuroLeague Codes:  +${fillCodeCount}`);
    console.log(`  • Missing Countries:         +${fillCountryCount}`);
    console.log(`  • Missing Birth Dates:       +${fillBirthDateCount}`);
    console.log(`  • Missing Heights:           +${fillHeightCount}`);
    console.log(`  • Missing Profile URLs:      +${fillProfileUrlCount}`);
    console.log('------------------------------------------------------------');
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
      console.log(`   Updated players bio records:   ${result.updatedPlayers}`);
      console.log(`   Created/updated season mappings: ${result.updatedMappings}`);
      console.log(`   Total entries synchronized:      ${result.totalEntries}\n`);
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
