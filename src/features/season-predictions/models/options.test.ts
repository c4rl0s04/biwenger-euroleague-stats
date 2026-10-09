import { describe, expect, it } from 'vitest';
import { withTeamCrests } from './options';

describe('season prediction options', () => {
  it('replaces broken frozen logo URLs without changing team eligibility or order', () => {
    const frozen = {
      players: [],
      teams: [
        { id: '560', name: 'Anadolu Efes', image: 'https://cdn.biwenger.com/teams/560.png' },
        { id: '579', name: 'Real Madrid', image: '/madrid.png' },
      ],
      managers: [],
    };
    const result = withTeamCrests(frozen, new Map([['560', 'https://official.test/efes.png']]));

    expect(result.teams).toEqual([
      { id: '560', name: 'Anadolu Efes', image: 'https://official.test/efes.png' },
      { id: '579', name: 'Real Madrid', image: '/madrid.png' },
    ]);
    expect(frozen.teams[0].image).toBe('https://cdn.biwenger.com/teams/560.png');
  });
});
