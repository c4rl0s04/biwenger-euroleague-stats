import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EXPECTED_PRODUCTION_MIGRATIONS,
  OFFICIAL_TABLES,
  assessProductionReadiness,
  assertProductionRepairAuthorized,
  type ProductionReadinessSnapshot,
} from '../production-readiness';

function readySnapshot(): ProductionReadinessSnapshot {
  return {
    incompatibleColumns: [],
    missingForeignKeys: [],
    missingIndexes: [],
    missingMigrations: [],
    missingTables: [],
    missingUniqueConstraints: [],
    unsafeRoleGrants: [],
    tablesWithoutRls: [],
    duplicateGroups: [],
    orphanedForeignKeys: [],
    migrationHashMismatches: [],
  };
}

describe('production season readiness', () => {
  it('reports a compatible, secured and fully migrated database as ready', () => {
    expect(assessProductionReadiness(readySnapshot())).toEqual({ ready: true, issues: [] });
  });

  it('reports every unsafe condition before an apply can run', () => {
    const snapshot = readySnapshot();
    snapshot.missingMigrations = [EXPECTED_PRODUCTION_MIGRATIONS[0]];
    snapshot.duplicateGroups = ['matches.unique_match'];
    snapshot.tablesWithoutRls = [OFFICIAL_TABLES[0]];
    snapshot.unsafeRoleGrants = [`${OFFICIAL_TABLES[0]}.anon.INSERT`];

    const assessment = assessProductionReadiness(snapshot);

    expect(assessment.ready).toBe(false);
    expect(assessment.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('migration'),
        expect.stringContaining('duplicate'),
        expect.stringContaining('RLS'),
        expect.stringContaining('grant'),
      ])
    );
  });

  it('requires explicit backup and remote-write confirmations', () => {
    expect(() => assertProductionRepairAuthorized({})).toThrow('BACKUP_CONFIRMED=true');
    expect(() => assertProductionRepairAuthorized({ BACKUP_CONFIRMED: 'true' })).toThrow(
      'ALLOW_REMOTE_SCHEMA_REPAIR=true'
    );
    expect(() =>
      assertProductionRepairAuthorized({
        BACKUP_CONFIRMED: 'true',
        ALLOW_REMOTE_SCHEMA_REPAIR: 'true',
      })
    ).not.toThrow();
  });

  it('keeps the production repair migration additive and secures official tables', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'drizzle', '0009_production_season_readiness.sql'),
      'utf8'
    );

    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    for (const table of OFFICIAL_TABLES) {
      expect(sql).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM anon, authenticated`);
      expect(sql).toContain(
        `REVOKE ALL PRIVILEGES ON SEQUENCE "${table}_id_seq" FROM anon, authenticated`
      );
    }
  });
});
