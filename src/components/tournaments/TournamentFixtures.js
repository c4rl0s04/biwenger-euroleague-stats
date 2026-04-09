'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getColorForUser } from '@/lib/constants/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function TournamentFixtures({ fixtures, initialRoundId }) {
  const [manualSelectedRoundId, setManualSelectedRoundId] = useState(null);

  // Extract unique rounds and sort them
  const rounds = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return [];

    const roundMap = new Map();
    fixtures.forEach((f) => {
      const rid = f.round_id;
      if (!rid) return;
      if (!roundMap.has(rid)) {
        roundMap.set(rid, {
          id: rid,
          name: f.round_name,
        });
      }
    });

    const uniqueRounds = Array.from(roundMap.values());

    // Sort by ID (assuming ID is chronological order for rounds)
    uniqueRounds.sort((a, b) => a.id - b.id);

    // Assign internal numbering
    return uniqueRounds.map((r, index) => ({
      ...r,
      internalNumber: index + 1,
    }));
  }, [fixtures]);

  // Determine the default round (respect initialRoundId from props or find first pending)
  const defaultRound = useMemo(() => {
    if (rounds.length === 0) return null;

    // 1. If initialRoundId is provided and exists in this tournament's rounds
    if (initialRoundId) {
      const found = rounds.find((r) => r.id === initialRoundId);
      if (found) return found;
    }

    // 2. Fallback: Find the first round that has at least one pending match
    const firstRoundWithPendingMatches = rounds.find((round) => {
      const roundFixtures = fixtures.filter((f) => f.round_id === round.id);
      return roundFixtures.some((f) => {
        const isFinished =
          f.status === 'finished' || (f.home_score !== null && f.away_score !== null);
        return !isFinished;
      });
    });

    return firstRoundWithPendingMatches || rounds[rounds.length - 1];
  }, [rounds, fixtures, initialRoundId]);

  const selectedRound = useMemo(() => {
    if (manualSelectedRoundId) {
      return rounds.find((r) => r.id === manualSelectedRoundId) || defaultRound;
    }
    return defaultRound;
  }, [manualSelectedRoundId, rounds, defaultRound]);

  const filteredFixtures = useMemo(() => {
    if (!fixtures || !selectedRound) return [];
    return fixtures.filter((f) => f.round_id === selectedRound.id);
  }, [fixtures, selectedRound]);

  const handlePrevRound = () => {
    const currentIndex = rounds.findIndex((r) => r.id === selectedRound?.id);
    if (currentIndex > 0) {
      setManualSelectedRoundId(rounds[currentIndex - 1].id);
    }
  };

  const handleNextRound = () => {
    const currentIndex = rounds.findIndex((r) => r.id === selectedRound?.id);
    if (currentIndex < rounds.length - 1) {
      setManualSelectedRoundId(rounds[currentIndex + 1].id);
    }
  };

  if (!fixtures || fixtures.length === 0) {
    return (
      <div className="text-center py-10 rounded-xl border border-dashed border-white/10 bg-white/5">
        <p className="text-muted-foreground">No hay partidos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Round Selector */}
      <ElegantCard hideHeader padding="p-0" color="zinc" bgColor="zinc" className="overflow-hidden">
        <div className="flex items-center justify-between p-2">
          <button
            onClick={handlePrevRound}
            disabled={rounds.findIndex((r) => r.id === selectedRound?.id) === 0}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-lg font-black text-white font-display leading-tight">
              Jornada {selectedRound?.internalNumber}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
              {selectedRound?.name}
            </span>
          </div>

          <button
            onClick={handleNextRound}
            disabled={rounds.findIndex((r) => r.id === selectedRound?.id) === rounds.length - 1}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-white cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </ElegantCard>

      {/* Fixtures List */}
      <div className="grid gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRound}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid gap-3"
          >
            {filteredFixtures.map((fixture) => {
              const isFinished =
                fixture.status === 'finished' ||
                (fixture.home_score !== null && fixture.away_score !== null);

              const homeWon = isFinished && fixture.home_score > fixture.away_score;
              const awayWon = isFinished && fixture.away_score > fixture.home_score;
              const isDraw = isFinished && fixture.home_score === fixture.away_score;

              return (
                <ElegantCard
                  key={fixture.id}
                  hideHeader
                  padding="p-4"
                  color={isFinished ? 'emerald' : 'zinc'}
                  bgColor={null}
                  className="w-full relative group"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center relative">
                    {/* Group/Info - Absolute Left */}
                    {fixture.group_name && (
                      <div className="absolute top-2 left-3 sm:top-1/2 sm:-translate-y-1/2 sm:left-4">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded-full border border-white/5">
                          Gr. {fixture.group_name}
                        </span>
                      </div>
                    )}

                    {/* Matchup - Center */}
                    <div className="flex items-center justify-center gap-4 sm:gap-8 w-full max-w-3xl mt-6 sm:mt-0">
                      {/* Home Team */}
                      <Link
                        href={`/user/${fixture.home_user_id}`}
                        className={`flex-1 flex flex-col items-center sm:items-end gap-2 text-center sm:text-right group/home transition-all hover:opacity-80 ${
                          isFinished && !homeWon && !isDraw ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className={`sm:hidden text-sm truncate w-full px-2 ${isFinished && homeWon ? 'font-black text-white' : 'font-medium text-zinc-300'}`}
                        >
                          {fixture.home_user_name}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`hidden sm:block text-sm transition-colors ${
                              isFinished && homeWon ? 'font-black' : 'font-medium'
                            } ${getColorForUser(fixture.home_user_id, fixture.home_user_name, fixture.home_user_color).text}`}
                          >
                            {fixture.home_user_name}
                          </span>
                          <div
                            className={`relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border shrink-0 shadow-lg transition-all ${isFinished && homeWon ? 'border-amber-500 shadow-amber-900/20 scale-110 ring-2 ring-amber-500/20' : 'border-white/10 group-hover/home:border-amber-500/30'}`}
                          >
                            {fixture.home_user_icon ? (
                              <img
                                src={
                                  fixture.home_user_icon.startsWith('http')
                                    ? fixture.home_user_icon
                                    : `https://cdn.biwenger.com/${fixture.home_user_icon}`
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5 text-zinc-500">
                                <User size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Score */}
                      <div
                        className={`px-4 py-1.5 rounded-lg text-xl font-black font-mono tracking-widest min-w-[80px] text-center border transition-all ${
                          isFinished
                            ? 'bg-zinc-900/80 text-white border-white/10 shadow-inner'
                            : 'bg-white/5 text-zinc-500 border-transparent'
                        }`}
                      >
                        <span className={isFinished && homeWon ? 'text-green-400' : ''}>
                          {fixture.home_score ?? '-'}
                        </span>
                        <span className="mx-1 opacity-50">:</span>
                        <span className={isFinished && awayWon ? 'text-green-400' : ''}>
                          {fixture.away_score ?? '-'}
                        </span>
                      </div>

                      {/* Away Team */}
                      <Link
                        href={`/user/${fixture.away_user_id}`}
                        className={`flex-1 flex flex-col items-center sm:items-start gap-2 text-center sm:text-left group/away transition-all hover:opacity-80 ${
                          isFinished && !awayWon && !isDraw ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className={`sm:hidden text-sm truncate w-full px-2 ${isFinished && awayWon ? 'font-black text-white' : 'font-medium text-zinc-300'}`}
                        >
                          {fixture.away_user_name}
                        </div>
                        <div className="flex items-center gap-3 flex-row-reverse sm:flex-row">
                          <span
                            className={`hidden sm:block text-sm transition-colors ${
                              isFinished && awayWon ? 'font-black' : 'font-medium'
                            } ${getColorForUser(fixture.away_user_id, fixture.away_user_name, fixture.away_user_color).text}`}
                          >
                            {fixture.away_user_name}
                          </span>
                          <div
                            className={`relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border shrink-0 shadow-lg transition-all ${isFinished && awayWon ? 'border-amber-500 shadow-amber-900/20 scale-110 ring-2 ring-amber-500/20' : 'border-white/10 group-hover/away:border-amber-500/30'}`}
                          >
                            {fixture.away_user_icon ? (
                              <img
                                src={
                                  fixture.away_user_icon.startsWith('http')
                                    ? fixture.away_user_icon
                                    : `https://cdn.biwenger.com/${fixture.away_user_icon}`
                                }
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5 text-zinc-500">
                                <User size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Status - Absolute Right */}
                    <div className="hidden sm:flex flex-col items-end absolute top-1/2 -translate-y-1/2 right-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${isFinished ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}
                      >
                        {isFinished ? 'Finalizado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </ElegantCard>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
