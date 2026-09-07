import fs from 'fs';

let content = fs.readFileSync('scripts/architecture/policy.json', 'utf8');
let policy = JSON.parse(content);

const newRoutes = [
  "src/app/(app)/standings/[section]/page.tsx",
  "src/app/api/standings/advanced/route.ts",
  "src/app/api/standings/analytics/route.ts",
  "src/app/api/standings/bottlers/route.ts",
  "src/app/api/standings/captains/route.ts",
  "src/app/api/standings/efficiency/route.ts",
  "src/app/api/standings/heartbreakers/route.ts",
  "src/app/api/standings/initial-squad-stats/route.ts",
  "src/app/api/standings/jinx/route.ts",
  "src/app/api/standings/league-comparison/route.ts",
  "src/app/api/standings/no-glory/route.ts",
  "src/app/api/standings/placements/route.ts",
  "src/app/api/standings/points-progression/route.ts",
  "src/app/api/standings/round-winners/route.ts",
  "src/app/api/standings/streaks/route.ts",
  "src/app/api/standings/theoretical/route.ts",
  "src/app/api/standings/volatility/route.ts"
];

for (const route of newRoutes) {
  if (!policy.entrypoints.includes(route)) {
    policy.entrypoints.push(route);
  }
}

fs.writeFileSync('scripts/architecture/policy.json', JSON.stringify(policy, null, 2));
