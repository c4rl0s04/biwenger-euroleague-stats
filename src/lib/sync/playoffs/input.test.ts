import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPlayoffImport } from './input';

describe('playoff import season selection', () => {
  it('requires an explicit season and rejects invalid season IDs', () => {
    expect(() => loadPlayoffImport([])).toThrow('Pass --season YYYY-YY');
    expect(() => loadPlayoffImport(['--season', '../2025-26'])).toThrow('Pass --season YYYY-YY');
  });

  it('loads the checked-in data for the requested season', () => {
    const input = loadPlayoffImport(['--season', '2025-26']);
    expect(input.seasonId).toBe('2025-26');
    expect(input.predictions).toHaveLength(60);
    expect(input.results).toHaveLength(10);
  });

  it('rejects a file copied to the wrong season name', () => {
    const directory = mkdtempSync(join(tmpdir(), 'playoffs-import-'));
    try {
      writeFileSync(
        join(directory, '2026-27.json'),
        JSON.stringify({ seasonId: '2025-26', predictions: [], media: [] })
      );
      expect(() => loadPlayoffImport(['--season=2026-27'], directory)).toThrow(
        'Playoff input declares 2025-26; requested season is 2026-27.'
      );
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
