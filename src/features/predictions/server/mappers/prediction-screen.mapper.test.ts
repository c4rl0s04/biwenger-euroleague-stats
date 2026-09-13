import { describe, expect, it } from 'vitest';
import type { PorrasStats, TableStat } from '../../models/predictions';
import { mapPredictionSection } from './prediction-screen.mapper';

const empty: PorrasStats = {
  achievements: { perfect_10: [], blanked: [] },
  participation: [],
  table_stats: [],
  performance: [],
  history: { users: [], jornadas: [] },
  clutch_stats: [],
  porra_stats: { victorias: [], predictable_teams: [], promedios: [], mejor_jornada: [] },
};

describe('phone Predictions section projection', () => {
  it('preserves empty sections and the existing history fallback', () => {
    for (const section of ['evolution', 'ranking', 'teams', 'history', 'unknown'])
      expect(mapPredictionSection(empty, section)).toEqual({ rows: [] });
  });
  it('preserves first-20 ordering, generic labels and ranking links', () => {
    const row: TableStat = {
      user_id: 7,
      usuario: 'Manager',
      color_index: 0,
      jornadas_jugadas: 1,
      total_aciertos: 9,
      promedio: 9,
      mejor_jornada: 9,
      peor_jornada: 9,
      exacts: 0,
      perfects: 0,
    };
    const stats = {
      ...empty,
      table_stats: Array.from({ length: 25 }, (_, i) => ({ ...row, user_id: i + 7 })),
    };
    const result = mapPredictionSection(stats, 'ranking');
    expect(result.rows).toHaveLength(20);
    expect(result.rows[0]).toEqual({ key: '7', title: 'Registro 1', href: '/user/7' });
    expect(result.rows[19]).toEqual({ key: '26', title: 'Registro 20', href: '/user/26' });
  });
  it('retains history names without exposing nested scores', () => {
    const stats = {
      ...empty,
      history: { users: [], jornadas: [{ id: 1, name: 'Jornada 1', scores: {} }] },
    };
    expect(mapPredictionSection(stats, 'history')).toEqual({
      rows: [{ key: '1', title: 'Jornada 1' }],
    });
  });
});
