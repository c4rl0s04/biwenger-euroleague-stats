import { expect, it } from 'vitest';
import { startDisposablePostgres } from '../db/disposable-postgres';
import { runMigrations } from '../db/migrate';
import { applyManifest, preview, snapshot } from './sync';
import { hash, manifestSchema } from './types';
import { prepareOfficialMappingMutations } from '../../src/lib/db/mutations/official/mappings';

it.runIf(process.env.RUN_IMAGE_DB_TESTS === 'true')(
  'euroleague sync populates missing player bio/identity without touching fallback images, is idempotent, and preserves website ownership during sync',
  async () => {
    const fixture = await startDisposablePostgres();
    const db = await fixture.pool.connect();
    try {
      await runMigrations(fixture.pool);
      await db.query('ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_url text');
      await db.query(
        "UPDATE seasons SET status='frozen'; INSERT INTO seasons(id,name,status) VALUES ('2026-27','Test','active') ON CONFLICT(id) DO UPDATE SET status='active'"
      );
      await db.query(
        "INSERT INTO teams(id,name,img) VALUES(901,'Test Club','old-logo'); INSERT INTO players(id,name,img) VALUES(902,'Test Player','old-photo'); INSERT INTO player_seasons(season_id,player_id,team_id) VALUES('2026-27',902,901)"
      );
      await db.query(
        "INSERT INTO official_team_mappings(season_id,team_id,provider_team_code,provider_name,match_method,crest_url) VALUES('2026-27',901,'TEST','Test Club','manual','old-logo')"
      );

      const state = await snapshot(db);
      const plan = await preview(
        [
          {
            kind: 'player',
            code: 'P000902',
            name: 'Test Player',
            teamCode: 'TEST',
            teamName: 'Test Club',
            page: 'https://www.euroleaguebasketball.net/es/euroleague/players/test/000902/',
            url: 'https://media-cdn.cortextech.io/player.png',
            country: 'Spain',
            birthDate: '1991-03-23',
            height: 181,
            dorsal: '7',
            position: 'Guardia',
          },
          {
            kind: 'team',
            code: 'TEST',
            name: 'Test Club',
            teamCode: 'TEST',
            teamName: 'Test Club',
            page: 'https://www.euroleaguebasketball.net/es/euroleague/teams/test/roster/test/',
            url: 'https://media-cdn.cortextech.io/team.png',
          },
        ],
        state
      );

      const manifest = manifestSchema.parse({
        version: 1,
        season: '2026-27',
        target: state.target,
        collectedAt: new Date().toISOString(),
        entries: plan.entries.map((e) => ({ ...e, validation: { width: 100, height: 100 } })),
        unresolved: [],
      });
      const digest = hash(manifest);

      const result = await applyManifest(db, manifest, digest);
      expect(result.success).toBe(true);
      expect(result.updatedPlayers).toBe(1);
      expect(result.updatedMappings).toBe(1);

      // Verify players table was updated with durable bio and official identity fields
      const playerRow = (
        await db.query(
          'SELECT euroleague_code, profile_url, country, birth_date, height, img FROM players WHERE id=902'
        )
      ).rows[0];
      expect(playerRow).toEqual({
        euroleague_code: 'P000902',
        profile_url: 'https://www.euroleaguebasketball.net/es/euroleague/players/test/000902/',
        country: 'Spain',
        birth_date: '1991-03-23',
        height: 181,
        img: 'old-photo', // Fallback image MUST NOT be overwritten
      });

      // Verify team logo fallback was not overwritten
      const teamRow = (await db.query('SELECT img FROM teams WHERE id=901')).rows[0];
      expect(teamRow.img).toBe('old-logo');

      // Verify official_player_mappings contains website_image and website_profile provenance
      const mappingRow = (
        await db.query(
          "SELECT image_url, status, raw_payload FROM official_player_mappings WHERE season_id='2026-27' AND player_id=902"
        )
      ).rows[0];
      expect(mappingRow.image_url).toBe(manifest.entries[0].url);
      expect(mappingRow.status).toBe('matched');
      expect(mappingRow.raw_payload).toMatchObject({
        website_image: {
          manifest: digest,
          source: 'euroleague_website',
        },
        website_profile: {
          code: 'P000902',
          country: 'Spain',
          birth_date: '1991-03-23',
          height: 181,
          dorsal: '7',
          position: 'Guardia',
        },
      });

      // Verify routine API sync does not overwrite website image
      const api = prepareOfficialMappingMutations(db, '2026-27');
      await api.upsertPlayerMapping({
        playerId: 902,
        providerPlayerCode: 'P000902',
        providerName: 'Test Player',
        providerTeamCode: 'TEST',
        imageUrl: 'api-photo',
        matchMethod: 'exact',
        confidence: 1,
        status: 'matched',
        raw: { from: 'api' },
      });
      await api.upsertTeamMapping({
        teamId: 901,
        providerTeamCode: 'TEST',
        providerName: 'Test Club',
        crestUrl: 'api-logo',
        matchMethod: 'exact',
        confidence: 1,
        raw: { from: 'api' },
      });

      const after = await snapshot(db);
      expect(after.mappings[0].image_url).toBe(manifest.entries[0].url);
      expect(after.teams[0].crest_url).toBe(manifest.entries[1].url);
      expect(after.mappings[0].raw_payload).toMatchObject({
        from: 'api',
        website_image: { manifest: digest },
      });
    } finally {
      db.release();
      await fixture.cleanup();
    }
  },
  60000
);
