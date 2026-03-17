'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { MatchCard } from './MatchCard';
import MatchesMap from '@/components/schedule/MatchesMap';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '@/components/layout';

import { RoundSelector } from './RoundSelector';

// Helper to group matches by date
function groupMatchesByDate(matches) {
  return matches.reduce((acc, match) => {
    const date = new Date(match.date);
    const dateKey = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Madrid',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});
}

export default function MatchesClient({ rounds, defaultRoundId }) {
  // Default to the provided defaultRoundId, or the first round if not found
  const [selectedRoundId, setSelectedRoundId] = useState(
    defaultRoundId || (rounds.length > 0 ? rounds[0].round_id : null)
  );

  const activeRound = rounds.find((r) => r.round_id === selectedRoundId);
  const matches = activeRound ? activeRound.matches : [];
  const groupedMatches = groupMatchesByDate(matches);

  if (!activeRound) return null;

  return (
    <div className="space-y-0">
      {/* Top Bar: Round Selector */}
      <div className="sticky top-4 z-30 flex items-center justify-center px-4">
        <RoundSelector
          rounds={rounds}
          selectedRoundId={selectedRoundId}
          onRoundChange={setSelectedRoundId}
        />
      </div>

      {/* Matches grouped by day */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedRoundId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {Object.entries(groupedMatches).map(([dateKey, dayMatches], index) => (
            <Section
              key={dateKey}
              title={dateKey}
              background={index % 2 === 0 ? 'section-base' : 'section-raised'}
              delay={index * 100}
            >
              <div className="grid gap-3">
                {dayMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </Section>
          ))}

          {/* Map Section - Placed at the very end */}
          <Section
            title="Mapa de Sedes"
            background={
              Object.keys(groupedMatches).length % 2 === 0 ? 'section-base' : 'section-raised'
            }
          >
            {/* Map Round Selector - z-50 ensures dropdown is on top of map */}
            <div className="mb-6 flex justify-center relative z-50">
              <RoundSelector
                rounds={rounds}
                selectedRoundId={selectedRoundId}
                onRoundChange={setSelectedRoundId}
                className="max-w-xs shadow-none border-white/5 bg-zinc-900/40"
              />
            </div>

            <MatchesMap roundName={activeRound.round_name} matches={matches} />
          </Section>

          {Object.keys(groupedMatches).length === 0 && (
            <div className="py-20 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800 mx-4">
              No hay partidos disponibles para esta jornada.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
