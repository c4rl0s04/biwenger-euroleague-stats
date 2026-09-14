import { describe, expect, it, vi } from 'vitest';
import { computeTournamentStatus, syncBiwengerTournaments } from '../tournaments';

describe('Biwenger Tournaments Service', () => {
  describe('computeTournamentStatus', () => {
    it('returns finished when tournament explicitly specifies a winner', () => {
      expect(computeTournamentStatus({ winner: { id: 10 } })).toBe('finished');
    });

    it('returns finished when status is explicitly finished', () => {
      expect(computeTournamentStatus({ status: 'finished' })).toBe('finished');
    });

    it('returns finished when all matches across all rounds are finished or have scores', () => {
      const data = {
        status: 'active',
        rounds: [
          {
            fixtures: [
              { status: 'finished', home: { score: 85 }, away: { score: 80 } },
              { status: 'finished', home: { score: 90 }, away: { score: 88 } },
            ],
          },
        ],
      };
      expect(computeTournamentStatus(data)).toBe('finished');
    });

    it('returns active when any match is scheduled and unscored', () => {
      const data = {
        status: 'active',
        rounds: [
          {
            fixtures: [
              { status: 'finished', home: { score: 85 }, away: { score: 80 } },
              { status: 'scheduled', home: {}, away: {} },
            ],
          },
        ],
      };
      expect(computeTournamentStatus(data)).toBe('active');
    });
  });

  describe('syncBiwengerTournaments orchestration', () => {
    it('throws when seasonId is missing', async () => {
      const manager: any = {
        context: { db: {} },
        log: vi.fn(),
      };
      await expect(syncBiwengerTournaments(manager)).rejects.toThrow(
        'Canonical sync season was not resolved before tournament ingestion.'
      );
    });

    it('returns count 0 when no tournaments are discovered in the schedule', async () => {
      const manager: any = {
        context: { db: {}, seasonId: '2025-26' },
        log: vi.fn(),
        getBiwengerCompetition: vi.fn().mockResolvedValue({
          rounds: [{ id: 1, name: 'Jornada 1' }],
        }),
      };

      const mockFetchRoundsLeague = vi.fn().mockResolvedValue({
        data: { fixtures: [{ id: 10 }] }, // no tournament metadata
      });

      const result = await syncBiwengerTournaments(manager, {
        fetchRoundsLeague: mockFetchRoundsLeague,
      });

      expect(result.counts.tournaments).toBe(0);
      expect(result.summary).toContain('No Biwenger tournaments were present');
    });

    it('discovers and ingests tournament with phases, fixtures, and standings', async () => {
      const mockUpsertTournament = vi.fn().mockResolvedValue(undefined);
      const mockUpsertPhase = vi.fn().mockResolvedValue(100);
      const mockUpsertFixture = vi.fn().mockResolvedValue(undefined);
      const mockUpsertStanding = vi.fn().mockResolvedValue(undefined);

      const mockMutations: any = {
        upsertTournament: mockUpsertTournament,
        upsertPhase: mockUpsertPhase,
        upsertFixture: mockUpsertFixture,
        upsertStanding: mockUpsertStanding,
      };

      const manager: any = {
        context: { db: {}, seasonId: '2025-26' },
        log: vi.fn(),
        getBiwengerCompetition: vi.fn().mockResolvedValue({
          rounds: [{ id: 1, name: 'Jornada 1' }],
        }),
      };

      const mockFetchRoundsLeague = vi.fn().mockResolvedValue({
        data: {
          fixtures: [
            {
              id: 501,
              tournament: { id: 77, name: 'Copa Navideña' },
            },
          ],
        },
      });

      const mockFetchTournament = vi.fn().mockResolvedValue({
        data: {
          id: 77,
          name: 'Copa Navideña',
          status: 'finished',
          winner: { id: 1 },
          rounds: [
            {
              type: 'eliminatoria',
              name: 'Final',
              fixtures: [
                {
                  id: 9001,
                  home: { id: 1, score: 95 },
                  away: { id: 2, score: 88 },
                  status: 'finished',
                },
              ],
            },
          ],
          phases: {
            eliminatoria: {
              groups: [
                {
                  name: 'Group A',
                  standings: [
                    {
                      team: { id: 1 },
                      position: 1,
                      points: 3,
                      won: 1,
                      lost: 0,
                      scored: 95,
                      against: 88,
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      const result = await syncBiwengerTournaments(manager, {
        fetchRoundsLeague: mockFetchRoundsLeague,
        fetchTournament: mockFetchTournament,
        prepareMutations: () => mockMutations,
        leagueId: 9999,
      });

      expect(mockUpsertTournament).toHaveBeenCalledTimes(1);
      expect(mockUpsertTournament).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 77,
          name: 'Copa Navideña',
          status: 'finished',
          league_id: 9999,
        })
      );
      expect(mockUpsertPhase).toHaveBeenCalledWith(
        expect.objectContaining({
          tournament_id: 77,
          type: 'eliminatoria',
        })
      );
      expect(mockUpsertFixture).toHaveBeenCalledTimes(1);
      expect(mockUpsertStanding).toHaveBeenCalledTimes(1);
      expect(result.counts.tournaments).toBe(1);
    });
  });
});
