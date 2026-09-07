import fs from 'fs';

let content = fs.existsSync('src/features/standings/public.ts') ? fs.readFileSync('src/features/standings/public.ts', 'utf8') : '';

let exports = `
// Components
export { default as DesktopStandingsScreen } from './components/DesktopStandingsScreen';
export { default as MobileStandingsScreen } from './components/MobileStandingsScreen';

// Export everything from the old index.js
export * from './components/index';
`;

fs.writeFileSync('src/features/standings/public.ts', content + '\\n' + exports);
