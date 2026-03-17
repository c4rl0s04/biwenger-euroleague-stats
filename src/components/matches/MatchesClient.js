'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { MatchCard } from './MatchCard';
import MatchesMap from '@/components/schedule/MatchesMap';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '@/components/layout';

import { RoundSelector } from './RoundSelector';
import { TeamSelector } from './TeamSelector';

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

// New Helper to group matches by status (for Team Timeline)
function groupMatchesByStatus(matches) {
  const now = new Date();
  return matches.reduce(
    (acc, match) => {
      const isPast = new Date(match.date) < now;
      const key = isPast ? 'Partidos Completados' : 'Próximos Partidos';
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    },
    { 'Partidos Completados': [], 'Próximos Partidos': [] }
  );
}

export default function MatchesClient({ rounds, defaultRoundId }) {
  const [selectedRoundId, setSelectedRoundId] = useState(
    defaultRoundId || (rounds.length > 0 ? rounds[0].round_id : null)
  );
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // Extract all unique teams from all rounds for the selector
  const allTeams = useMemo(() => {
    const teamsMap = new Map();
    rounds.forEach((round) => {
      round.matches.forEach((m) => {
        if (m.home) teamsMap.set(m.home.id, m.home);
        if (m.away) teamsMap.set(m.away.id, m.away);
      });
    });
    return Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rounds]);

  // Derived data based on mode (Round vs Team)
  const isTeamMode = selectedTeamId !== null;

  const activeRound = rounds.find((r) => r.round_id === selectedRoundId);

  // Get matches based on active filter
  const matchesToDisplay = useMemo(() => {
    if (isTeamMode) {
      // Get ALL matches for this team across the entire season
      const teamMatches = [];
      rounds.forEach((r) => {
        r.matches.forEach((m) => {
          if (m.home?.id === selectedTeamId || m.away?.id === selectedTeamId) {
            teamMatches.push(m);
          }
        });
      });
      // Sort by date chromologically
      return teamMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return activeRound ? activeRound.matches : [];
  }, [isTeamMode, selectedTeamId, activeRound, rounds]);

  const groupedMatches = isTeamMode
    ? groupMatchesByStatus(matchesToDisplay)
    : groupMatchesByDate(matchesToDisplay);

  if (!activeRound && !isTeamMode) return null;

  return (
    <div className="space-y-0">
      {/* Top Bar: Dual Selectors */}
      <div className="sticky top-4 z-30 flex flex-col md:flex-row items-center justify-center gap-3 px-4">
        <RoundSelector
          rounds={rounds}
          selectedRoundId={selectedRoundId}
          onRoundChange={(id) => {
            setSelectedRoundId(id);
            setSelectedTeamId(null); // Clear team filter when switching rounds
          }}
          className={cn(
            isTeamMode && 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all'
          )}
        />

        <TeamSelector
          teams={allTeams}
          selectedTeamId={selectedTeamId}
          onTeamChange={setSelectedTeamId}
          className="w-full md:w-auto"
        />
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isTeamMode ? `team-${selectedTeamId}` : `round-${selectedRoundId}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {Object.entries(groupedMatches).map(([key, sectionMatches], index) => {
            if (sectionMatches.length === 0) return null;

            return (
              <Section
                key={key}
                title={key}
                background={index % 2 === 0 ? 'section-base' : 'section-raised'}
                delay={index * 100}
              >
                <div className="grid gap-3">
                  {sectionMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </Section>
            );
          })}

          {/* Map Section */}
          <Section
            title={isTeamMode ? 'European Tour' : 'Mapa de Sedes'}
            background={
              Object.keys(groupedMatches).length % 2 === 0 ? 'section-base' : 'section-raised'
            }
          >
            {!isTeamMode && (
              <div className="mb-6 flex justify-center relative z-50">
                <RoundSelector
                  rounds={rounds}
                  selectedRoundId={selectedRoundId}
                  onRoundChange={setSelectedRoundId}
                  className="max-w-xs shadow-none border-white/5 bg-zinc-900/40"
                />
              </div>
            )}

            <MatchesMap
              roundName={activeRound?.round_name}
              matches={matchesToDisplay}
              selectedTeamId={selectedTeamId}
            />
          </Section>

          {matchesToDisplay.length === 0 && (
            <div className="py-20 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800 mx-4">
              No hay partidos disponibles para esta selección.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
