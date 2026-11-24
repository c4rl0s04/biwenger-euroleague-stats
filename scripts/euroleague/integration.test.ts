import { expect, it } from 'vitest';
import { startDisposablePostgres } from '../db/disposable-postgres';
import { runMigrations } from '../db/migrate';
import { applyManifest, preview, snapshot } from './sync';
import { hash, manifestSchema, SEASON, type Asset } from './types';
import { prepareOfficialMappingMutations } from '../../src/lib/db/mutations/official/mappings';

it.runIf(process.env.RUN_IMAGE_DB_TESTS === 'true')(
  'imports portraits by official code and preserves the source preference across API syncs',
  async () => {
    const fixture = await startDisposablePostgres();
    const db = await fixture.pool.connect();
    try {
      await runMigrations(fixture.pool);
      await db.query("UPDATE seasons SET status='frozen'");
      await db.query(
        "INSERT INTO seasons (id, name, status) VALUES ($1, 'Test', 'active') ON CONFLICT (id) DO UPDATE SET status='active'",
        [SEASON]
      );
      await db.query(
        "INSERT INTO players (id, name, img) VALUES (902, 'Fantasy Name', 'old-photo')"
      );
      await db.query("INSERT INTO teams (id, name, img) VALUES (901, 'Test Club', 'old-crest')");

      const api = prepareOfficialMappingMutations(db, SEASON);
      const team = {
        teamId: 901,
        providerTeamCode: 'TEST',
        providerName: 'Test Club',
        crestUrl: 'api-crest',
        matchMethod: 'exact',
        confidence: 1,
      };
      await api.upsertTeamMapping(team);
      const profile = {
        playerId: null,
        providerPlayerCode: 'P000901',
        providerName: 'Official Name',
        providerTeamCode: 'TEST',
        matchMethod: 'unresolved',
        confidence: 0,
        status: 'review_required' as const,
        raw: { website_image: null, api: true },
      };
      await api.upsertPlayerMapping(profile);
      await api.upsertPlayerMapping({
        ...profile,
        providerPlayerCode: 'P000902',
        playerId: 902,
        status: 'matched',
        confidence: 1,
        matchMethod: 'manual',
      });
      await api.upsertPlayerMapping({ ...profile, providerPlayerCode: 'P000903' });

      const assets = ['P000901', 'P000902', 'P000903', 'P000904'].map((code): Asset => ({
        kind: 'player',
        code,
        name: 'Website Name',
        teamCode: null,
        teamName: null,
        page: `https://www.euroleaguebasketball.net/es/euroleague/players/test/${code.slice(1)}/`,
        url: `https://media-cdn.cortextech.io/${code}.png`,
      }));
      const crest: Asset = {
        kind: 'team',
        code: 'TEST',
        name: 'Test Club',
        teamCode: 'TEST',
        teamName: 'Test Club',
        page: 'https://www.euroleaguebasketball.net/es/euroleague/teams/test/roster/test/',
        url: 'https://media-cdn.cortextech.io/team.png',
      };
      const state = await snapshot(db);
      const plan = preview([...assets, crest], state);
      expect(plan.unresolved).toEqual([
        { name: 'Website Name', reason: 'Official player code P000904 missing or ambiguous' },
      ]);
      const manifest = manifestSchema.parse({
        version: 1,
        season: SEASON,
        target: state.target,
        collectedAt: new Date().toISOString(),
        entries: plan.entries.map((entry) => ({
          ...entry,
          validation: entry.code === 'P000903' ? null : { width: 100, height: 100 },
        })),
        unresolved: plan.unresolved,
      });
      const digest = hash(manifest);
      expect(await applyManifest(db, manifest, digest)).toEqual({
        updatedPortraits: 2,
        updatedCrests: 1,
      });
      await applyManifest(db, manifest, digest);

      const after = await snapshot(db);
      expect(after.mappings).toHaveLength(3);
      for (const [index, row] of after.mappings.entries()) {
        const old = state.mappings[index];
        expect(row).toMatchObject({
          player_id: old.player_id,
          provider_name: old.provider_name,
          status: old.status,
          match_method: old.match_method,
          confidence: old.confidence,
        });
        if (index < 2) {
          expect(row.image_url).toBe(assets[index].url);
          expect(row.raw_payload).toMatchObject({
            api: true,
            website_image: { manifest: digest, source: 'euroleague_website' },
          });
        } else {
          expect(row).toEqual(old);
        }
      }
      expect(
        (await db.query('SELECT name, img, euroleague_code FROM players WHERE id=902')).rows[0]
      ).toEqual({ name: 'Fantasy Name', img: 'old-photo', euroleague_code: null });

      const missingImage = {
        ...manifest,
        entries: manifest.entries.map((entry) => ({ ...entry, url: null, validation: null })),
      };
      await applyManifest(db, missingImage, hash(missingImage));
      await api.upsertTeamMapping({ ...team, crestUrl: 'new-api-crest' });
      await api.upsertPlayerMapping({ ...profile, imageUrl: 'api-photo', raw: { api: 'latest' } });
      await api.upsertPlayerMapping({
        ...profile,
        providerPlayerCode: 'P000903',
        imageUrl: 'api-fallback',
        raw: { api: 'latest' },
      });

      const synced = await snapshot(db);
      expect(synced.teams[0]).toMatchObject({
        crest_url: crest.url,
        raw_payload: { website_image: { manifest: digest } },
      });
      expect(synced.mappings[0]).toMatchObject({
        image_url: assets[0].url,
        raw_payload: { api: 'latest', website_image: { manifest: digest } },
      });
      expect(synced.mappings[2]).toMatchObject({
        image_url: 'api-fallback',
        raw_payload: { api: 'latest' },
      });
      expect(synced.mappings[2].raw_payload).not.toHaveProperty('website_image');
    } finally {
      db.release();
      await fixture.cleanup();
    }
  },
  60000
);
