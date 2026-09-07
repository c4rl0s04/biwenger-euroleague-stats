import fs from 'fs';

let content = fs.readFileSync('src/features/standings/models/theoretical.ts', 'utf8');
content = content.replace(/\{ id: number; name: string \}\[\];/, '{ id: number; name: string; shortName?: string }[];');
fs.writeFileSync('src/features/standings/models/theoretical.ts', content);

let mapperContent = fs.readFileSync('src/features/standings/server/mappers/theoretical.mapper.ts', 'utf8');
mapperContent = mapperContent.replace(/export const mapTheoreticalGapStat = \(row: TheoreticalGapStatRecord\): TheoreticalGapStat => row;/g, `
export const mapTheoreticalGapStat = (row: any): TheoreticalGapStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  current_points: Number(row.current_points),
  perfectTotal: Number(row.perfectTotal),
  gap: Number(row.gap),
  pct: Number(row.pct),
});
`);
mapperContent = mapperContent.replace(/export const mapLeagueComparisonStat = \(row: LeagueComparisonStatRecord\): LeagueComparisonStat => row;/g, `
export const mapLeagueComparisonStat = (row: any): LeagueComparisonStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  above_avg_count: Number(row.above_avg_count),
  below_avg_count: Number(row.below_avg_count),
  avg_diff: Number(row.avg_diff),
});
`);
mapperContent = mapperContent.replace(/export const mapRivalryMatrixStat = \(row: RivalryMatrixStatRecord\): RivalryMatrixStat => row;/g, `
export const mapRivalryMatrixStat = (row: any): RivalryMatrixStat => ({
  users: Array.isArray(row?.users) ? row.users.map((u: any) => ({
    id: Number(u.id),
    name: String(u.name),
    icon: u.icon ? String(u.icon) : '',
    color_index: Number(u.color_index),
  })) : [],
  matrix: row?.matrix || {},
});
`);
mapperContent = mapperContent.replace(/export const mapHeatmapStat = \(row: HeatmapStatRecord\): HeatmapStat => row;/g, `
export const mapHeatmapStat = (row: any): HeatmapStat => ({
  rounds: Array.isArray(row?.rounds) ? row.rounds.map((r: any) => ({
    id: Number(r.id),
    name: String(r.name),
    shortName: r.shortName ? String(r.shortName) : undefined,
  })) : [],
  users: Array.isArray(row?.users) ? row.users.map((u: any) => ({
    id: Number(u.id),
    name: String(u.name),
    icon: u.icon ? String(u.icon) : '',
    color_index: Number(u.color_index),
    scores: Array.isArray(u.scores) ? u.scores.map((s: any) => s !== null ? Number(s) : null) : [],
  })) : [],
});
`);
mapperContent = mapperContent.replace(/export const mapTheoreticalStandingsStat = \(row: TheoreticalStandingsStatRecord\): TheoreticalStandingsStat => row;/g, `
export const mapTheoreticalStandingsStat = (row: any): TheoreticalStandingsStat => ({
  user_id: String(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  total_actual: Number(row.total_actual),
  total_ideal: Number(row.total_ideal),
  gap: Number(row.gap),
  efficiency: Number(row.efficiency),
  rounds_played: Number(row.rounds_played),
});
`);
fs.writeFileSync('src/features/standings/server/mappers/theoretical.mapper.ts', mapperContent);

