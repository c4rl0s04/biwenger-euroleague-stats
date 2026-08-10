import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const requiredConfiguration = [
  'SEASON_ID',
  'SEASON_NAME',
  'BIWENGER_LEAGUE_ID',
  'BIWENGER_USER_ID',
  'EUROLEAGUE_SEASON_CODE',
  'LEAGUE_START_DATE',
  'SEASON_AWARE_READS_CONFIRMED',
];

describe('sync workflow season configuration', () => {
  for (const workflowName of ['sync.yml', 'sync-live.yml']) {
    it(`${workflowName} validates the complete canonical configuration`, () => {
      const workflow = fs.readFileSync(
        path.join(process.cwd(), '.github', 'workflows', workflowName),
        'utf8'
      );

      for (const key of requiredConfiguration) expect(workflow).toContain(`${key}:`);
      expect(workflow).toContain('sync:preflight');
      expect(workflow).not.toContain('E2025');
      expect(workflow).not.toContain('SYNC_SEASON_ID');
    });
  }

  it('the official image sync uses the canonical EuroLeague code', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src', 'lib', 'sync', 'steps', '11-official-images.ts'),
      'utf8'
    );
    expect(source).toContain('CONFIG.SEASON.EUROLEAGUE_CODE');
    expect(source).not.toContain('E2025');
  });
});
