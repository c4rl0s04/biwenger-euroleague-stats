import { describe, expect, it } from 'vitest';
import {
  mapRoundCandidate,
  mapRoundCoach,
  mapRoundGlobal,
  mapRoundIdeal,
  mapRoundLineup,
  mapRoundManager,
  mapRoundOptimization,
  mapRoundStanding,
} from './round-read.mapper';
import { coach, globalStats, manager, standing } from '../services/round-read.fixtures';

const extra = { credential: 'synthetic-excluded-field' };
const candidate = {
  player_id: 11,
  name: null,
  position: null,
  img: null,
  team_short: null,
  team_img: null,
  points: null,
};
const optimized = { ...candidate, valuation: null, role: 'bench', is_captain: false };
describe('Round read projections', () => {
  it('allowlists directory and standing fields with original strings/nulls/false', () => {
    expect(mapRoundManager({ ...manager, ...extra })).toEqual(manager);
    expect(mapRoundStanding({ ...standing, ...extra }, 0)).toEqual({
      ...standing,
      ideal_points: 0,
    });
    const { past_total: _past, ...official } = standing;
    expect(mapRoundStanding(official, 0)).not.toHaveProperty('past_total');
  });
  it('allowlists actual lineup players and summary without normalizing nullable fields', () => {
    const player = {
      player_id: 11,
      name: 'Ghost',
      position: 'Bench',
      img: null,
      team: 'Unknown Team',
      team_short: null,
      team_img: null,
      is_captain: null,
      role: null,
      raw_points: null,
      valuation: 0,
      stats_points: 0,
      stats_rebounds: 0,
      stats_assists: 0,
      minutes: null,
      current_status: null,
      player_exists: null,
      points: 12,
      is_missing: true,
      calculated: true,
    };
    const summary = { total_points: 12, round_rank: 1, participated: null };
    expect(
      mapRoundLineup({ players: [{ ...player, ...extra }], summary: { ...summary, ...extra } })
    ).toEqual({ players: [player], summary });
    expect(mapRoundLineup({ players: [], summary: null })).toEqual({ players: [], summary: null });
  });
  it('keeps distinct left-out, optimization and global ideal player envelopes', () => {
    expect(mapRoundCandidate({ ...candidate, ...extra })).toEqual(candidate);
    expect(
      mapRoundOptimization({ optimalLineup: [{ ...optimized, ...extra }], totalPoints: 1.5 })
    ).toEqual({ optimalLineup: [optimized], totalPoints: 1.5 });
    const idealPlayer = {
      ...optimized,
      role: 'bench' as const,
      team_id: null,
      stats_points: 0,
      multiplier: 0.5,
    };
    expect(mapRoundIdeal({ idealLineup: [{ ...idealPlayer, ...extra }], totalPoints: 0 })).toEqual({
      idealLineup: [idealPlayer],
      totalPoints: 0,
    });
    expect(
      mapRoundCoach({ ...coach, idealLineup: [{ ...optimized, ...extra }], ...extra })
    ).toEqual({ ...coach, idealLineup: [optimized] });
    expect(mapRoundCoach(null)).toBeNull();
  });
  it('allowlists nested global leaders and preserves empty global shape', () => {
    const leader = { id: 11, name: null, img: null, position: null, team_name: null };
    const mvp = { ...leader, points: null, valuation: null };
    const stat = { ...leader, stat_value: 0 };
    const winner = { name: null, points: 0, icon: null };
    const result = mapRoundGlobal({
      mvp: { ...mvp, ...extra },
      topScorer: { ...stat, ...extra },
      topRebounder: { ...stat, ...extra },
      topAssister: { ...stat, ...extra },
      winner: { ...winner, ...extra },
      avgScore: 1.5,
    });
    expect(result).toEqual({
      mvp,
      topScorer: stat,
      topRebounder: stat,
      topAssister: stat,
      winner,
      avgScore: 1.5,
    });
    expect(mapRoundGlobal(globalStats)).toEqual(globalStats);
    expect(JSON.stringify(result)).not.toContain('synthetic-excluded-field');
  });
});
