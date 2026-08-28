import { describe, expect, it } from 'vitest';
import { parseSyncArgs } from '../index';
import { PIPELINE, selectPipeline, validatePipeline } from '../pipeline';

describe('declarative sync pipeline', () => {
  it('has unique ordered dependencies and one explicit owner for fantasy points and ownership', () => {
    expect(() => validatePipeline()).not.toThrow();
    expect(new Set(PIPELINE.map((step) => step.id)).size).toBe(PIPELINE.length);
    expect(
      PIPELINE.filter((step) => step.writes.includes('player_round_stats:fantasy_points')).map(
        (step) => step.id
      )
    ).toEqual(['biwenger-fantasy-points']);
    expect(
      PIPELINE.filter((step) => step.writes.includes('player_seasons:owner_id')).map(
        (step) => step.id
      )
    ).toEqual(['biwenger-squads']);
  });

  it('selects routine, bootstrap and live responsibilities explicitly', () => {
    expect(selectPipeline('routine').map((step) => step.id)).not.toContain('initial-squads');
    expect(selectPipeline('bootstrap').map((step) => step.id)).toContain('initial-squads');
    expect(selectPipeline('live').map((step) => step.id)).toEqual([
      'euroleague-games',
      'biwenger-lineups',
    ]);
  });

  it('rejects numeric steps and unsafe force-game combinations', () => {
    expect(() => selectPipeline('routine', '5')).toThrow(/Unknown sync step/);
    expect(() => parseSyncArgs(['--force-game=10'])).toThrow(/requires --step=euroleague-games/);
    expect(parseSyncArgs(['--step=euroleague-games', '--force-game=10'])).toEqual({
      mode: 'routine',
      step: 'euroleague-games',
      forceGame: 10,
    });
  });
});
