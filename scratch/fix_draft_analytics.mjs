import fs from 'fs';

// 1. Fix models/draft.ts
let models = fs.readFileSync('src/features/standings/models/draft.ts', 'utf8');
models = models.replace(/total_points: number;/, `actual_points: number;
  potential_points: number;
  roi_percentage: number;`);
// also DraftAnalyticsViewModel shouldn't exist as a wrapper, the API returns the array directly. 
// But the assignment said: "Original HTTP success is { success: true, data: [...] }... It is NOT { success: true, data: { performance: [...] } }"
// So I will just return the array in the service. I can delete DraftAnalyticsViewModel or just not use it.
fs.writeFileSync('src/features/standings/models/draft.ts', models);

// 2. Fix server/mappers/draft.mapper.ts
let mapper = fs.readFileSync('src/features/standings/server/mappers/draft.mapper.ts', 'utf8');
mapper = mapper.replace(/total_points: Number\(row\.total_points \|\| row\.actual_points \|\| 0\),/, `actual_points: Number(row.actual_points || 0),
    potential_points: Number(row.potential_points || 0),
    roi_percentage: Number(row.roi_percentage || 0),`);
fs.writeFileSync('src/features/standings/server/mappers/draft.mapper.ts', mapper);

// 3. Fix server/queries/draft.query.ts
let queryFile = fs.readFileSync('src/features/standings/server/queries/draft.query.ts', 'utf8');
queryFile = queryFile.replace(/total_points: number;/g, `actual_points: number;
  potential_points: number;
  roi_percentage: number;`);
queryFile = queryFile.replace(/total_points: Number\(row.actual_points \|\| 0\),/g, `actual_points: Number(row.actual_points || 0),
    potential_points: Number(row.potential_points || 0),
    roi_percentage: Number(row.roi_percentage || 0),`);
fs.writeFileSync('src/features/standings/server/queries/draft.query.ts', queryFile);

// 4. Fix server/services/draft.service.ts
let service = fs.readFileSync('src/features/standings/server/services/draft.service.ts', 'utf8');
// Remove cache wrapper from fetchInitialSquadAnalytics
// Change return { performance: ... } to return data.map(...)
service = service.replace(/export const fetchInitialSquadAnalytics = cache\(async \(\) => \{[\s\S]*?\}\);/, `export const fetchInitialSquadAnalytics = async () => {
  const data = await getInitialSquadActualPerformance();
  return data.map(mapDraftPerformance);
};`);
fs.writeFileSync('src/features/standings/server/services/draft.service.ts', service);

