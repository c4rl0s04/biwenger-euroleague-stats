import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const requiredConfiguration = ['DATABASE_URL', 'BIWENGER_TOKEN', 'BIWENGER_API_VERSION_FALLBACK'];

describe('sync workflow season configuration', () => {
  for (const workflowName of ['sync.yml', 'sync-live.yml', 'sync-bootstrap.yml']) {
    it(`${workflowName} validates the complete canonical configuration`, () => {
      const workflow = fs.readFileSync(
        path.join(process.cwd(), '.github', 'workflows', workflowName),
        'utf8'
      );

      for (const key of requiredConfiguration) expect(workflow).toContain(`${key}:`);
      expect(workflow).toContain('sync:preflight');
      expect(workflow).not.toContain('E2025');
      expect(workflow).not.toContain('SYNC_SEASON_ID');
      for (const name of [
        'POSTGRES_HOST',
        'BIWENGER_LEAGUE_ID',
        'BIWENGER_USER_ID',
        'SEASON_ID',
        'SEASON_NAME',
        'EUROLEAGUE_SEASON_CODE',
        'LEAGUE_START_DATE',
      ])
        expect(workflow).not.toContain(`${name}:`);
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

  it('bootstrap workflow is manual-only and runs the bootstrap pipeline after preflight', () => {
    const bootstrap = fs.readFileSync(
      path.join(process.cwd(), '.github', 'workflows', 'sync-bootstrap.yml'),
      'utf8'
    );

    expect(bootstrap).toContain('workflow_dispatch:');
    expect(bootstrap).not.toContain('schedule:');
    expect(bootstrap).toContain('npm run sync:preflight && npm run sync:bootstrap');
  });
});
