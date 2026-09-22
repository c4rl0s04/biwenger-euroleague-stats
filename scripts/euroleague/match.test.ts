import { describe, expect, it } from 'vitest';
import { matchPlayer } from './match';

describe('EuroLeague Matcher & Overrides', () => {
  it('matches by existing euroleague_code in candidate', async () => {
    const candidates = [{ id: 10, name: 'Campazzo', teamCode: 'MAD', euroleagueCode: 'P005928' }];
    const res = await matchPlayer(
      { name: 'FACUNDO CAMPAZZO', teamCode: 'MAD', code: 'P005928' },
      candidates,
      []
    );
    expect(res).toEqual({ id: 10, method: 'existing_euroleague_code' });
  });

  it('matches by exact name within team and rejects cross-team', async () => {
    const candidates = [{ id: 1, name: 'Alberto Abalde', teamCode: 'MAD' }];
    expect(
      await matchPlayer(
        { name: 'Álberto Abalde', teamCode: 'MAD', code: 'P003733' },
        candidates,
        []
      )
    ).toEqual({ id: 1, method: 'exact_name_team' });

    expect(
      await matchPlayer(
        { name: 'Álberto Abalde', teamCode: 'BAR', code: 'P003733' },
        candidates,
        []
      )
    ).toBeNull();
  });

  it('matches inverted name tokens (token_permutation_team)', async () => {
    const candidates = [{ id: 30, name: 'Dossou-yovo Mathis', teamCode: 'ASV' }];
    expect(
      await matchPlayer(
        { name: 'MATHIS DOSSOU-YOVO', teamCode: 'ASV', code: 'P007483' },
        candidates,
        []
      )
    ).toEqual({ id: 30, method: 'token_permutation_team' });
  });

  it('matches single surname and suffix variations within team', async () => {
    const candidates = [
      { id: 40, name: 'Campazzo', teamCode: 'MAD' },
      { id: 41, name: 'Baldwin Jr', teamCode: 'RED' },
    ];
    expect(
      await matchPlayer(
        { name: 'FACUNDO CAMPAZZO', teamCode: 'MAD', code: 'P005928' },
        candidates,
        []
      )
    ).toEqual({ id: 40, method: 'surname_team' });

    expect(
      await matchPlayer(
        { name: 'PATRICK BALDWIN', teamCode: 'RED', code: 'P014728' },
        candidates,
        []
      )
    ).toEqual({ id: 41, method: 'surname_team' });
  });

  it('matches using persistent manual override', async () => {
    const candidates = [{ id: 99, name: 'Special Nickname', teamCode: 'BES' }];
    const overrides = {
      'BES:P009025': {
        playerCode: 'P009025',
        teamCode: 'BES',
        siteName: 'ANTHONY BROWN',
        targetId: 99,
        targetName: 'Special Nickname',
        resolvedBy: 'manual_test',
      },
    };
    const res = await matchPlayer(
      { name: 'ANTHONY BROWN', teamCode: 'BES', code: 'P009025' },
      candidates,
      [],
      { overrides }
    );
    expect(res).toEqual({ id: 99, method: 'manual_override' });
  });

  it('rejects ambiguous matches when multiple candidates match surname', async () => {
    const candidates = [
      { id: 50, name: 'John Smith', teamCode: 'MAD' },
      { id: 51, name: 'Bob Smith', teamCode: 'MAD' },
    ];
    expect(
      await matchPlayer({ name: 'MICHAEL SMITH', teamCode: 'MAD', code: 'P009999' }, candidates, [])
    ).toBeNull();
  });
});
