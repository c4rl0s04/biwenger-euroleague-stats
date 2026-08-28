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
  'BIWENGER_API_VERSION_FALLBACK',
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

  it('scheduled workflows use the simplified routine and live commands', () => {
    const routine = fs.readFileSync(
      path.join(process.cwd(), '.github', 'workflows', 'sync.yml'),
      'utf8'
    );
    const live = fs.readFileSync(
      path.join(process.cwd(), '.github', 'workflows', 'sync-live.yml'),
      'utf8'
    );
    expect(routine).toContain('npm run sync:preflight && npm run sync');
    expect(routine).not.toContain('sync:daily');
    expect(live).toContain('npm run sync:live');
  });
});
