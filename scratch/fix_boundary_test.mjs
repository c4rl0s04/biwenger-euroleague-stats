import fs from 'fs';

let content = fs.readFileSync('src/features/standings/server/all-play-all-boundary.test.ts', 'utf8');

// We should mock the service, not the entire server barrel!
content = content.replace(/vi\.mock\('@\/features\/standings\/server', \(\) => \(\{/, "vi.mock('@/features/standings/server/services/all-play-all.service', () => ({");

fs.writeFileSync('src/features/standings/server/all-play-all-boundary.test.ts', content);

