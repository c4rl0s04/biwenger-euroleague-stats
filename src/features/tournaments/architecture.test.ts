import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
it('keeps catalogue/detail pages on complete screen-model service contracts', () => {
  for (const [path, service] of [
    ['src/app/(app)/tournaments/page.tsx', 'getTournamentCatalogueScreen'],
    ['src/app/(app)/tournaments/[id]/page.tsx', 'getTournamentDetailScreen'],
  ]) {
    const page = read(path);
    expect(page).toContain(service);
    expect(page).not.toMatch(
      /getAllTournaments|getTournamentDetails|getStandings|getFixtures|Presentation\(|\.data\b|Promise\.all/
    );
  }
  expect(read('src/features/tournaments/server/services/tournament-screen.service.ts')).toMatch(
    /^import 'server-only';/
  );
});
it('keeps bracket scoring and snapshot interpretation out of client presentation', () => {
  const bracket = read('src/features/tournaments/components/TournamentBracket.js');
  expect(bracket).not.toMatch(/tournament\??\.|phaseMap|processedIds|home_score|away_score/);
  expect(bracket).toContain('TournamentBracketRound[]');
  const desktop = read(
    'src/features/tournaments/components/screens/DesktopTournamentDetailScreen.jsx'
  );
  expect(desktop).not.toMatch(/tournament\.data\b|data_json/);
  expect(desktop).toContain('TournamentDesktopDetail');
});
it('keeps migrated tournament screens free of snapshot and loose-record props', () => {
  for (const name of [
    'MobileTournamentsScreen',
    'MobileTournamentDetailScreen',
    'DesktopTournamentsScreen',
  ]) {
    const source = read(`src/features/tournaments/components/screens/${name}.tsx`);
    expect(source).not.toMatch(/\bany\b|\bRecord\s*</);
    expect(source).not.toMatch(/tournament\.data\b|data_json/);
  }
  expect(read('src/features/tournaments/components/TournamentRow.js')).not.toMatch(
    /tournament\.data\b|data_json/
  );
});
it('keeps tournament server markers, client-safe models and persistence ownership explicit', () => {
  for (const path of [
    'server.ts',
    'server/queries/tournament.query.ts',
    'server/services/tournament-read.service.ts',
    'server/services/tournament-statistics.service.ts',
  ])
    expect(read(`src/features/tournaments/${path}`)).toMatch(/^import 'server-only';/);
  expect(read('src/features/tournaments/public.ts')).not.toMatch(/server|queries/);
  expect(read('src/features/tournaments/models/tournaments.ts')).not.toMatch(/import|\bany\b/);
  expect(read('src/features/tournaments/server/services/tournament-read.service.ts')).not.toContain(
    '@/lib/db'
  );
  expect(read('src/features/tournaments/server/queries/tournament.query.ts')).toContain(
    '@/lib/db/connection'
  );
  expect(read('src/features/tournaments/server/queries/tournament.query.ts')).not.toContain(
    "@/lib/db'"
  );
});

it('keeps global statistics in a typed feature calculation without obsolete service adapters', () => {
  const service = read('src/features/tournaments/server/services/tournament-statistics.service.ts');
  const mapper = read('src/features/tournaments/server/mappers/tournament-statistics.mapper.ts');
  const models = read('src/features/tournaments/models/tournament-statistics.ts');
  for (const source of [service, mapper, models]) {
    expect(source).not.toMatch(/\bany\b|@\/lib\/db|@\/lib\/services/);
  }
  expect(mapper).not.toMatch(/\bawait\b|\bfetch\s*\(|\bquery\s*\(/);
  expect(service).toContain("serverCache: 'none;");
  for (const path of [
    'src/lib/services/statsService.ts',
    'src/lib/services/tournamentService.ts',
    'src/lib/db/queries/tournaments.ts',
    'src/features/tournaments/components/TournamentCard.js',
  ]) {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  }
});
