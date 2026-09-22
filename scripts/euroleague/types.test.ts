import { describe, expect, it } from 'vitest';
import {
  normalizeEuroleaguePlayerCode,
  normalizeCountry,
  stripSuffix,
  parseSpanishDate,
  assetSchema,
  portraitUrl,
  hash,
} from './types';

describe('EuroLeague Types & Normalizers', () => {
  it('normalizes numeric and veteran alphabetic Euroleague player codes', () => {
    expect(normalizeEuroleaguePlayerCode('005928')).toBe('P005928');
    expect(normalizeEuroleaguePlayerCode('5928')).toBe('P005928');
    expect(normalizeEuroleaguePlayerCode('P005928')).toBe('P005928');
    expect(normalizeEuroleaguePlayerCode('tgb')).toBe('PTGB');
    expect(normalizeEuroleaguePlayerCode('PTGB')).toBe('PTGB');
    expect(
      normalizeEuroleaguePlayerCode(
        'https://www.euroleaguebasketball.net/es/euroleague/players/facundo-campazzo/005928/'
      )
    ).toBe('P005928');
    expect(
      normalizeEuroleaguePlayerCode(
        'https://www.euroleaguebasketball.net/es/euroleague/players/sergio-llull/tgb/'
      )
    ).toBe('PTGB');
    expect(() => normalizeEuroleaguePlayerCode('!@#$%')).toThrow('Invalid Euroleague player code');
  });

  it('normalizes country names to canonical database values', () => {
    expect(normalizeCountry('United States')).toBe('United States of America');
    expect(normalizeCountry('USA')).toBe('United States of America');
    expect(normalizeCountry('Turkey')).toBe('Turkiye');
    expect(normalizeCountry('Spain')).toBe('Spain');
    expect(normalizeCountry(null)).toBeNull();
    expect(normalizeCountry('')).toBeNull();
  });

  it('strips generational suffixes cleanly', () => {
    expect(stripSuffix('Baldwin Jr.')).toBe('Baldwin');
    expect(stripSuffix('Bingham Jr')).toBe('Bingham');
    expect(stripSuffix('Derrick Alston Jr. ')).toBe('Derrick Alston');
    expect(stripSuffix('John Smith III')).toBe('John Smith');
  });

  it('parses localized Spanish birth dates accurately', () => {
    expect(parseSpanishDate('23 mar 1991')).toBe('1991-03-23');
    expect(parseSpanishDate('5 ago 1997')).toBe('1997-08-05');
    expect(parseSpanishDate('15 nov. 1987')).toBe('1987-11-15');
    expect(parseSpanishDate('invalid date')).toBeNull();
  });

  it('selects correct portrait URL and validates asset schema', () => {
    const url = portraitUrl('FACUNDO CAMPAZZO', [
      { alt: 'team', source: 'https://media-cdn.cortextech.io/logo.png' },
      {
        alt: 'FACUNDO CAMPAZZO',
        source: 'https://media-cdn.cortextech.io/portrait.png?width=176 88w',
      },
    ]);
    expect(url).toBe('https://media-cdn.cortextech.io/portrait.png?width=176');

    const valid = {
      kind: 'player',
      code: 'P005928',
      name: 'FACUNDO CAMPAZZO',
      teamCode: 'MAD',
      teamName: 'Real Madrid',
      page: 'https://www.euroleaguebasketball.net/es/euroleague/players/facundo-campazzo/005928/',
      url,
      country: 'Spain',
      birthDate: '1991-03-23',
      height: 181,
      dorsal: '7',
      position: 'Guardia',
    };
    expect(assetSchema.safeParse(valid).success).toBe(true);

    // Also valid with null url (for placeholder silhouette filter)
    expect(assetSchema.safeParse({ ...valid, url: null }).success).toBe(true);
  });

  it('produces deterministic hash fingerprints independent of key order', () => {
    expect(hash({ a: 1, b: 2 })).toBe(hash({ b: 2, a: 1 }));
  });
});
