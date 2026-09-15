import { describe, it, expect } from 'vitest';
import { getScoreColor, getShortTeamName } from '@/lib/utils/format';

describe('getScoreColor', () => {
  it('returns sky or blue class for score >= 10', () => {
    expect(getScoreColor(10)).toContain('blue');
    expect(getScoreColor(15)).toContain('sky');
  });

  it('returns green class for score >= 5 and < 10', () => {
    expect(getScoreColor(5)).toContain('green');
    expect(getScoreColor(9)).toContain('green');
  });

  it('returns orange class for score > 0 and < 5', () => {
    expect(getScoreColor(1)).toContain('orange');
    expect(getScoreColor(4)).toContain('orange');
  });

  it('returns slate-700 class for score == 0', () => {
    expect(getScoreColor(0)).toContain('slate-700');
  });

  it('returns rose class for DNP score "X"', () => {
    expect(getScoreColor('X')).toContain('rose');
  });

  it('returns neutral slate-800 class for unavailable score "?" without red styling', () => {
    const color = getScoreColor('?');
    expect(color).toContain('slate-800');
    expect(color).not.toContain('red');
    expect(color).not.toContain('rose');
  });

  it('returns neutral slate-800 class for null and undefined', () => {
    expect(getScoreColor(null)).toContain('slate-800');
    expect(getScoreColor(undefined)).toContain('slate-800');
  });

  it('returns red class for score >= -10 and < 0', () => {
    expect(getScoreColor(-1)).toContain('red');
    expect(getScoreColor(-10)).toContain('red');
  });

  it('returns red class for score below -10', () => {
    expect(getScoreColor(-11)).toContain('red');
  });

  it('accepts a numeric string', () => {
    expect(getScoreColor('10')).toContain('blue');
  });
});

describe('getShortTeamName', () => {
  it('returns empty string for null', () => {
    expect(getShortTeamName(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(getShortTeamName(undefined)).toBe('');
  });

  it('returns mapped short name for known team', () => {
    expect(getShortTeamName('Real Madrid')).toBe('R. Madrid');
    expect(getShortTeamName('FC Barcelona')).toBe('Barça');
    expect(getShortTeamName('Zalgiris Kaunas')).toBe('Zalgiris');
  });

  it('returns original name for unknown team', () => {
    expect(getShortTeamName('Unknown Team FC')).toBe('Unknown Team FC');
  });

  it('handles sponsored / alternate team names', () => {
    expect(getShortTeamName('Maccabi Rapyd Tel Aviv')).toBe('Maccabi');
    expect(getShortTeamName('Kosner Baskonia Vitoria-Gasteiz')).toBe('Baskonia');
  });
});
