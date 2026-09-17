import { expect, it } from 'vitest';
import { mapNormalizedPrediction, mapPredictableTeam } from './predictions.mapper';

it('allowlists normalized rows and preserves text IDs, nulls and numeric conversions', () => {
  const row = {
    user_id: '01',
    usuario: null,
    user_icon: null,
    color_index: 0,
    jornada: 'Jornada 1',
    base_round_id: 1,
    total_aciertos: '08',
    result: '1-X-2',
    is_partial: true,
    total_matches: '10',
    user_matches: '3',
    unrelated: { marker: 'must-not-escape' },
  };
  const result = mapNormalizedPrediction(row);
  expect(result).toEqual({
    user_id: '01',
    usuario: null,
    user_icon: null,
    color_index: 0,
    jornada: 'Jornada 1',
    base_round_id: 1,
    result: '1-X-2',
    aciertos: 8,
    is_partial: true,
    total_matches: 10,
    user_matches: 3,
  });
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  expect(row.total_aciertos).toBe('08');
});

it('allowlists predictable-team rows without changing nullable labels or counts', () => {
  const result = mapPredictableTeam({
    id: 7,
    name: null,
    img: null,
    total: '12',
    correct: '8',
    predicted_wins: '6',
    predicted_losses: '4',
    correct_wins: '5',
    correct_losses: '3',
    percentage: '66.7',
  });
  expect(result).toEqual({
    id: 7,
    name: null,
    img: null,
    total: 12,
    correct: 8,
    predicted_wins: 6,
    predicted_losses: 4,
    correct_wins: 5,
    correct_losses: 3,
    percentage: 66.7,
  });
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});
