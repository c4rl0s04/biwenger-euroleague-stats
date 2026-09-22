import { createHash } from 'node:crypto';
import { z } from 'zod';

export const SEASON = '2026-27';

export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

export function normalizeEuroleaguePlayerCode(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  const segment = trimmed.includes('/') ? trimmed.split('/').at(-1)! : trimmed;
  const upper = segment.toUpperCase();
  if (/^P\d{6}$/.test(upper) || /^P[A-Z]+$/.test(upper)) {
    return upper;
  }
  if (/^\d+$/.test(upper)) {
    return 'P' + upper.padStart(6, '0');
  }
  if (/^[A-Z0-9]+$/i.test(upper)) {
    return upper.startsWith('P') ? upper : 'P' + upper;
  }
  throw new Error(`Invalid Euroleague player code: ${input}`);
}

const COUNTRY_MAP: Record<string, string> = {
  'United States': 'United States of America',
  USA: 'United States of America',
  US: 'United States of America',
  Turkey: 'Turkiye',
  Türkiye: 'Turkiye',
  Czechia: 'Czech Republic',
  Russia: 'Russian Federation',
  UK: 'United Kingdom',
  'Great Britain': 'United Kingdom',
  England: 'United Kingdom',
  "Cote d'Ivoire": 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  'Cape Verde': 'Cabo Verde',
  Macedonia: 'North Macedonia',
  FYROM: 'North Macedonia',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
};

export function normalizeCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  if (!trimmed) return null;
  return COUNTRY_MAP[trimmed] || trimmed;
}

export function stripSuffix(name: string): string {
  return name
    .replace(/\b(JR|SR|II|III|IV)\b\.?/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

const SPANISH_MONTHS: Record<string, string> = {
  ene: '01',
  feb: '02',
  mar: '03',
  abr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dic: '12',
};

export function parseSpanishDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})/i);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const monthStr = m[2].toLowerCase().slice(0, 3);
  const month = SPANISH_MONTHS[monthStr];
  if (!month) return null;
  const year = m[3];
  return `${year}-${month}-${day}`;
}

export function imageUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !['media-cdn.cortextech.io', 'media-cdn.incrowdsports.com'].includes(url.hostname)
  ) {
    throw new Error('Unapproved official image URL');
  }
  return url.href;
}

export function portraitUrl(
  name: string,
  images: { alt: string; source: string }[]
): string | null {
  const matches = images.filter((i) => normalize(i.alt) === normalize(name));
  if (matches.length !== 1) return null;
  try {
    return imageUrl(matches[0].source.split(',')[0].trim().split(/\s+/)[0]);
  } catch {
    return null;
  }
}

export function hash(value: unknown): string {
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, x]) => [k, canonical(x)])
          )
        : v;
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}

export const officialPage = z
  .string()
  .url()
  .refine((v) => {
    const u = new URL(v);
    return (
      u.protocol === 'https:' &&
      u.hostname === 'www.euroleaguebasketball.net' &&
      !u.username &&
      !u.password
    );
  });

export const assetSchema = z
  .object({
    kind: z.enum(['player', 'team']),
    code: z.string().min(1),
    name: z.string().min(1),
    teamCode: z.string().nullable(),
    teamName: z.string().nullable(),
    page: officialPage,
    url: z
      .string()
      .nullable()
      .refine((v) => {
        if (v === null) return true;
        try {
          imageUrl(v);
          return true;
        } catch {
          return false;
        }
      }),
    country: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
    weight: z.number().int().positive().nullable().optional(),
    dorsal: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
  })
  .strict();

export type Asset = z.infer<typeof assetSchema>;

export const collectionSchema = z
  .object({
    season: z.literal(SEASON),
    complete: z.literal(true),
    collectedAt: z.string().datetime(),
    assets: z.array(assetSchema).min(1),
    missing: z.array(z.object({ name: z.string(), reason: z.string() })).default([]),
    coverage: z.enum(['directory_and_rosters', 'rosters']),
  })
  .strict();

export type Collection = z.infer<typeof collectionSchema>;

export interface Candidate {
  id: number;
  name: string;
  teamCode: string | null;
  euroleagueCode?: string | null;
  country?: string | null;
  birthDate?: string | null;
  height?: number | null;
  weight?: number | null;
  profileUrl?: string | null;
}

export interface Mapping {
  player_id: number | null;
  provider_player_code: string;
  status: string;
}

export const manualOverrideSchema = z.object({
  playerCode: z.string().min(1),
  teamCode: z.string().min(1),
  siteName: z.string().min(1),
  targetId: z.number().int().positive(),
  targetName: z.string().min(1),
  resolvedBy: z.string(),
});

export type ManualOverride = z.infer<typeof manualOverrideSchema>;

export const entrySchema = assetSchema
  .extend({
    targetId: z.number().int().positive(),
    teamCode: z.string().min(1),
    method: z.string(),
    before: z.record(z.string(), z.unknown()).nullable(),
    validation: z.object({ width: z.number(), height: z.number() }).nullable(),
  })
  .strict();

export type ManifestEntry = z.infer<typeof entrySchema>;

export const manifestSchema = z
  .object({
    version: z.literal(1),
    season: z.literal(SEASON),
    collectedAt: z.string().datetime(),
    target: z.string(),
    entries: z.array(entrySchema),
    unresolved: z.array(z.object({ name: z.string(), reason: z.string() })),
  })
  .strict();

export type Manifest = z.infer<typeof manifestSchema>;
