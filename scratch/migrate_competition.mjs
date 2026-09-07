import fs from 'fs';

fs.renameSync('src/lib/db/queries/competition/standings.ts', 'src/features/standings/server/queries/base.query.ts');

function fixImports(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/from '\.\.\/\.\.\/index'/g, "from '@/lib/db'");
  content = content.replace(/from '\.\.\/\.\.\/\.\.\/utils\/cache'/g, "from '@/lib/utils/cache'");
  content = content.replace(/from '\.\.\/\.\.\/\.\.\/utils\/format'/g, "from '@/lib/utils/format'");
  content = content.replace(/from '\.\.\/\.\.\/season-context'/g, "from '@/lib/db/season-context'");
  content = content.replace(/from '\.\.\/\.\.\/schema'/g, "from '@/lib/db/schema'");
  content = "import 'server-only';\n" + content;
  fs.writeFileSync(file, content);
}

fixImports('src/features/standings/server/queries/base.query.ts');

fs.writeFileSync('src/lib/db/queries/competition/standings.ts', "export { getExtendedStandings, getRoundWinners, getLeagueTotals, getPointsProgression, getValueRanking, getWinCounts, getSimpleStandings, getLeaderComparison, getLeagueAveragePoints } from '@/features/standings/server';");

let server = fs.readFileSync('src/features/standings/server.ts', 'utf8');
const exports = `
export { getExtendedStandings, getRoundWinners, getLeagueTotals, getPointsProgression, getValueRanking, getWinCounts, getSimpleStandings, getLeaderComparison, getLeagueAveragePoints } from './server/queries/base.query';
`;
fs.writeFileSync('src/features/standings/server.ts', server + '\\n' + exports);
