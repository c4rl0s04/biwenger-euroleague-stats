import { z } from 'zod';
import type { DbClient } from '../matches';

const biographySchema = z.object({
  country: z.string().trim().min(1).max(100).nullish().catch(null),
  birth_date: z.iso.date().nullish().catch(null),
  height: z.number().int().min(100).max(300).nullish().catch(null),
  weight: z.number().int().min(30).max(300).nullish().catch(null),
});

export function readWebsiteBiography(value: unknown) {
  const result = biographySchema.safeParse(value);
  if (!result.success) return {};
  const { country, birth_date, height, weight } = result.data;
  return {
    ...(country ? { country } : {}),
    ...(birth_date ? { birth_date } : {}),
    ...(height ? { height } : {}),
    ...(weight ? { weight } : {}),
  };
}

export async function fillMissingOfficialPlayerBiographies(db: DbClient, seasonId: string) {
  const { rows } = await db.query(
    `SELECT m.player_id, m.raw_payload->'website_profile' AS biography
     FROM official_player_mappings m
     JOIN player_seasons ps ON ps.season_id = m.season_id AND ps.player_id = m.player_id
     JOIN players p ON p.id = ps.player_id
     WHERE m.season_id = $1 AND m.provider = 'euroleague_advanced' AND m.status = 'matched'
       AND jsonb_typeof(m.raw_payload->'website_profile') = 'object'
       AND (NULLIF(btrim(p.country), '') IS NULL OR NULLIF(btrim(p.birth_date), '') IS NULL
         OR p.height IS NULL OR p.weight IS NULL)`,
    [seasonId]
  );
  const profiles = (rows as { player_id: number; biography: unknown }[]).map((row) => ({
    player_id: row.player_id,
    ...readWebsiteBiography(row.biography),
  }));
  if (!profiles.length) return 0;

  const result = await db.query(
    `UPDATE players p
     SET country = CASE WHEN NULLIF(btrim(p.country), '') IS NULL AND bio.country IS NOT NULL
           THEN bio.country ELSE p.country END,
         birth_date = CASE WHEN NULLIF(btrim(p.birth_date), '') IS NULL AND bio.birth_date IS NOT NULL
           THEN bio.birth_date ELSE p.birth_date END,
         height = COALESCE(p.height, bio.height),
         weight = COALESCE(p.weight, bio.weight)
     FROM jsonb_to_recordset($1::jsonb) AS bio(
       player_id integer, country text, birth_date text, height integer, weight integer
     )
     WHERE p.id = bio.player_id
       AND ((NULLIF(btrim(p.country), '') IS NULL AND bio.country IS NOT NULL)
         OR (NULLIF(btrim(p.birth_date), '') IS NULL AND bio.birth_date IS NOT NULL)
         OR (p.height IS NULL AND bio.height IS NOT NULL)
         OR (p.weight IS NULL AND bio.weight IS NOT NULL))`,
    [JSON.stringify(profiles)]
  );
  return result.rowCount ?? 0;
}
