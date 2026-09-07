import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server/all-play-all-boundary.test.ts', 'utf8');
content = content.replace(/expect\(route\).toContain\("from '@\/lib\/services'"\);/, 'expect(route).not.toContain("from \'@/lib/services\'");');
fs.writeFileSync('src/features/standings/server/all-play-all-boundary.test.ts', content);
