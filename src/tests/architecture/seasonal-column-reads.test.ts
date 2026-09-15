import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const srcDir = path.resolve(import.meta.dirname, '../..');
const projectRoot = path.resolve(srcDir, '..');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function collectSourceFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(collectSourceFiles(fullPath));
    } else {
      const ext = path.extname(file);
      if (
        SOURCE_EXTENSIONS.has(ext) &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.test.tsx') &&
        !file.endsWith('.test.js') &&
        !file.endsWith('.test.jsx') &&
        !file.endsWith('.spec.ts') &&
        !file.endsWith('.spec.tsx') &&
        !file.endsWith('.spec.js') &&
        !file.endsWith('.spec.jsx') &&
        !file.endsWith('.d.ts')
      ) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export const DROPPED_PLAYER_COLUMNS = [
  'position',
  'puntos',
  'partidos_jugados',
  'played_home',
  'played_away',
  'points_home',
  'points_away',
  'points_last_season',
  'owner_id',
  'status',
  'price_increment',
  'price',
  'dorsal',
  'team_id',
];

export const DROPPED_TEAM_COLUMNS = ['city', 'arena_name', 'latitude', 'longitude'];

function extractTableAliases(sqlText: string, tableName: string): Set<string> {
  const aliases = new Set<string>([tableName]);
  if (tableName === 'players') aliases.add('p');
  if (tableName === 'teams') aliases.add('t');
  const regex = new RegExp(`\\b${tableName}\\s+(?:AS\\s+)?([a-zA-Z0-9_]+)\\b`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sqlText)) !== null) {
    const candidate = match[1].toLowerCase();
    const reserved = [
      'join',
      'where',
      'on',
      'left',
      'right',
      'inner',
      'set',
      'values',
      'group',
      'order',
      'limit',
    ];
    if (!reserved.includes(candidate)) {
      aliases.add(match[1]);
    }
  }
  return aliases;
}

export function findSeasonalColumnViolationsInSql(sqlText: string): string[] {
  const hasPlayers = /\bplayers\b/i.test(sqlText);
  const hasTeams = /\bteams\b/i.test(sqlText);

  if (!hasPlayers && !hasTeams) {
    return [];
  }

  const violations: string[] = [];

  // 1. Check players table aliases and dropped columns
  const playerAliases = extractTableAliases(sqlText, 'players');
  const playerColsPattern = DROPPED_PLAYER_COLUMNS.join('|');
  for (const alias of Array.from(playerAliases)) {
    const pattern = new RegExp(`\\b${alias}\\.(?:${playerColsPattern})\\b`, 'gi');
    const matches = sqlText.match(pattern);
    if (matches) {
      violations.push(...matches);
    }
  }

  // 2. Check teams table aliases and dropped columns
  const teamAliases = extractTableAliases(sqlText, 'teams');
  const teamColsPattern = DROPPED_TEAM_COLUMNS.join('|');
  for (const alias of Array.from(teamAliases)) {
    const pattern = new RegExp(`\\b${alias}\\.(?:${teamColsPattern})\\b`, 'gi');
    const matches = sqlText.match(pattern);
    if (matches) {
      violations.push(...matches);
    }
  }

  // 3. Explicit check for un-aliased or direct table.column references
  for (const col of DROPPED_PLAYER_COLUMNS) {
    const directPattern = new RegExp(`\\bplayers\\.${col}\\b`, 'gi');
    const matches = sqlText.match(directPattern);
    if (matches) {
      violations.push(...matches);
    }
  }

  for (const col of DROPPED_TEAM_COLUMNS) {
    const directPattern = new RegExp(`\\bteams\\.${col}\\b`, 'gi');
    const matches = sqlText.match(directPattern);
    if (matches) {
      violations.push(...matches);
    }
  }

  // 4. Scoped check for COALESCE references using dropped columns
  const coalescePattern = /COALESCE\s*\([^)]*\b(?:p|t)\.([a-zA-Z0-9_]+)\b[^)]*\)/gi;
  let coalesceMatch: RegExpExecArray | null;
  while ((coalesceMatch = coalescePattern.exec(sqlText)) !== null) {
    const colName = coalesceMatch[1].toLowerCase();
    if (DROPPED_PLAYER_COLUMNS.includes(colName) || DROPPED_TEAM_COLUMNS.includes(colName)) {
      violations.push(coalesceMatch[0]);
    }
  }

  return Array.from(new Set(violations));
}

describe('seasonal-column-reads architectural guard', () => {
  it('ensures no SQL query in src/ reads dropped seasonal columns from global tables', () => {
    const files = collectSourceFiles(srcDir);
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const file of files) {
      const sourceText = readFileSync(file, 'utf8');
      if (!sourceText.includes('players') && !sourceText.includes('teams')) {
        continue;
      }
      const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);

      const visit = (node: ts.Node): void => {
        let sqlText: string | null = null;
        if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) {
          sqlText = node.text;
        } else if (ts.isTemplateExpression(node)) {
          sqlText = node.getText(sourceFile);
        }

        if (sqlText) {
          const found = findSeasonalColumnViolationsInSql(sqlText);
          if (found.length > 0) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            for (const match of found) {
              violations.push({
                file: path.relative(projectRoot, file),
                line: line + 1,
                match,
              });
            }
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    expect(violations).toEqual([]);
  }, 30000);

  describe('self-tests for architectural guard', () => {
    it('catches arbitrary alias reads on dropped player columns', () => {
      const sql1 = 'SELECT pl.price FROM players pl WHERE pl.id = 1';
      expect(findSeasonalColumnViolationsInSql(sql1)).toEqual(['pl.price']);

      const sql2 = 'SELECT x.dorsal, x.puntos FROM players AS x';
      expect(findSeasonalColumnViolationsInSql(sql2)).toEqual(['x.dorsal', 'x.puntos']);

      const sql3 = 'SELECT players.points_home FROM players';
      expect(findSeasonalColumnViolationsInSql(sql3)).toEqual(['players.points_home']);
    });

    it('catches arbitrary alias reads on dropped team columns', () => {
      const sql1 = 'SELECT t_alias.arena_name FROM teams t_alias';
      expect(findSeasonalColumnViolationsInSql(sql1)).toEqual(['t_alias.arena_name']);

      const sql2 = 'SELECT teams.city, teams.latitude FROM teams';
      expect(findSeasonalColumnViolationsInSql(sql2)).toEqual(['teams.city', 'teams.latitude']);
    });

    it('catches COALESCE fallbacks to global player/team tables', () => {
      const sql =
        'SELECT COALESCE(ps.team_id, p.team_id) FROM players p JOIN player_seasons ps ON ps.player_id = p.id';
      const violations = findSeasonalColumnViolationsInSql(sql);
      expect(violations.length).toBeGreaterThan(0);
    });

    it('permits valid reads from seasonal tables with legitimate joins', () => {
      const valid1 = `
        SELECT p.id, p.name, ps.price, ps.puntos, ps.team_id, ts.city, ts.arena_name
        FROM players p
        JOIN player_seasons ps ON ps.player_id = p.id AND ps.season_id = $1
        JOIN team_seasons ts ON ts.team_id = ps.team_id AND ts.season_id = $1
      `;
      expect(findSeasonalColumnViolationsInSql(valid1)).toEqual([]);

      const valid2 = `
        SELECT t.id, t.name, t.code, ts.city
        FROM teams t
        LEFT JOIN team_seasons ts ON ts.team_id = t.id AND ts.season_id = '2025-26'
      `;
      expect(findSeasonalColumnViolationsInSql(valid2)).toEqual([]);
    });
  });
});
