import fs from 'fs';

let content = fs.readFileSync('src/app/api/standings/__tests__/standings.test.ts', 'utf8');
content = content.replace(/await importOriginal\(\)/g, "await importOriginal<typeof import('@/features/standings/server')>()");
fs.writeFileSync('src/app/api/standings/__tests__/standings.test.ts', content);

let allPlayAll = fs.readFileSync('src/features/standings/server/all-play-all-http.contract.test.ts', 'utf8');
allPlayAll = allPlayAll.replace(/await importOriginal\(\)/g, "await importOriginal<typeof import('@/features/standings/server')>()");
fs.writeFileSync('src/features/standings/server/all-play-all-http.contract.test.ts', allPlayAll);

