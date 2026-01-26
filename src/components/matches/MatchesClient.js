'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function Dropdown({ icon, label, children, align = 'left', fullWidth = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [containerRef]);

  return (
    <div className={cn('relative', fullWidth && 'w-full')} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
          'hover:bg-white/5 text-zinc-300 hover:text-white',
          isOpen && 'bg-white/5 text-white',
          fullWidth && 'w-full justify-center'
        )}
      >
        <span className="text-zinc-500">{icon}</span>
        <span className="truncate max-w-[120px] md:max-w-none">{label}</span>
        <ChevronDown
          size={14}
          className={cn('text-zinc-600 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 z-[100] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black overflow-hidden min-w-[240px] animate-in fade-in zoom-in-95 duration-100',
            align === 'left'
              ? 'left-0'
              : align === 'right'
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2'
          )}
        >
          {typeof children === 'function' ? children(() => setIsOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export default function MatchesClient({ rounds, defaultRoundId }) {
  // Default to the provided defaultRoundId, or the first round if not found
  const [selectedRoundId, setSelectedRoundId] = useState(
    defaultRoundId || (rounds.length > 0 ? rounds[0].round_id : null)
  );

  const activeRound = rounds.find((r) => r.round_id === selectedRoundId);
  const matches = activeRound ? activeRound.matches : [];

  const handlePrevRound = () => {
    const idx = rounds.findIndex((r) => r.round_id === selectedRoundId);
    if (idx < rounds.length - 1) {
      setSelectedRoundId(rounds[idx + 1].round_id);
    }
  };

  const handleNextRound = () => {
    const idx = rounds.findIndex((r) => r.round_id === selectedRoundId);
    if (idx > 0) {
      setSelectedRoundId(rounds[idx - 1].round_id);
    }
  };

  if (!activeRound) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Bar: Round Selector */}
      <div className="sticky top-4 z-30 flex items-center justify-center">
        <div className="flex items-center p-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50 w-full max-w-md">
          {/* Prev Arrow */}
          <button
            onClick={handlePrevRound}
            disabled={rounds.findIndex((r) => r.round_id === selectedRoundId) >= rounds.length - 1}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous Round"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Dropdown in the middle */}
          <div className="flex-1">
            <Dropdown
              icon={<Calendar size={16} />}
              label={activeRound.round_name}
              align="center"
              fullWidth
            >
              {(close) => (
                <div className="max-h-[300px] overflow-y-auto sidebar-scroll">
                  <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 sticky top-0 bg-zinc-950 z-50">
                    Jornadas
                  </div>
                  <div className="p-1">
                    {rounds.map((r) => (
                      <button
                        key={r.round_id}
                        onClick={() => {
                          setSelectedRoundId(r.round_id);
                          close();
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors my-0.5 cursor-pointer',
                          r.round_id === selectedRoundId
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                        )}
                      >
                        {r.round_name}
                        {r.round_id === selectedRoundId && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Dropdown>
          </div>

          {/* Next Arrow */}
          <button
            onClick={handleNextRound}
            disabled={rounds.findIndex((r) => r.round_id === selectedRoundId) <= 0}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Round"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Matches List with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedRoundId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid gap-3"
        >
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}

          {matches.length === 0 && (
            <div className="py-20 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
              No hay partidos disponibles para esta jornada.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
