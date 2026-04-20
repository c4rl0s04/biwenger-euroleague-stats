'use client';

import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';

// Hooks
import { useHoopgridGame } from '@/hooks/hoopgrid/useHoopgridGame';
import { useHoopgridShare } from '@/hooks/hoopgrid/useHoopgridShare';

// Components
import HoopgridBoard from './HoopgridBoard';
import HoopgridStats from './HoopgridStats';
import HoopgridHeader from './HoopgridHeader';
import HoopgridInstructions from './HoopgridInstructions';
import HoopgridSearch from './HoopgridSearch';
import HoopgridShareModal from './HoopgridShareModal';

/**
 * Main Hoopgrid Orchestrator.
 * Connects the game logic (hooks) with the UI components.
 */
export default function HoopgridClient() {
  const gridRef = useRef(null);
  const { currentUser } = useUser();

  // 1. Logic Engine
  const {
    challenge,
    guesses,
    loading,
    activeCell,
    isSubmitted,
    submitting,
    correctGuessesCount,
    setActiveCell,
    handleGuess,
    handleSubmitBoard,
  } = useHoopgridGame();

  // 2. Share Engine
  const { copying, shareModalOpen, shareImageUri, shareText, setShareModalOpen, handleShare } =
    useHoopgridShare(gridRef, challenge, guesses, currentUser);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Header & Stats */}
      <HoopgridHeader
        challenge={challenge}
        isSubmitted={isSubmitted}
        handleShare={handleShare}
        copying={copying}
      />

      <HoopgridStats
        guesses={guesses}
        isSubmitted={isSubmitted}
        correctGuessesCount={correctGuessesCount}
      />

      {/* 2. The Interactive Board */}
      <HoopgridBoard
        gridRef={gridRef}
        challenge={challenge}
        guesses={guesses}
        activeCell={activeCell}
        setActiveCell={setActiveCell}
        isSubmitted={isSubmitted}
        currentUser={currentUser}
      />

      {/* 3. Action Toolbar */}
      <div className="w-full flex flex-col items-center gap-6 mb-12">
        {!isSubmitted && correctGuessesCount > 0 && (
          <button
            onClick={handleSubmitBoard}
            disabled={submitting}
            className="px-8 py-3 bg-primary text-primary-foreground font-display text-lg uppercase tracking-widest rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? 'Guardando...' : 'Finalizar Cuadrícula'}
          </button>
        )}
      </div>

      {/* 4. Instructions Footer */}
      <HoopgridInstructions />

      {/* 5. Modals (Managed by AnimatePresence) */}
      <AnimatePresence>
        {activeCell !== null && (
          <HoopgridSearch
            onClose={() => setActiveCell(null)}
            onSelect={handleGuess}
            title={`${challenge.rows[Math.floor(activeCell / 3)].label} + ${
              challenge.cols[activeCell % 3].label
            }`}
            possibleCount={challenge.possibleCounts?.[activeCell]}
            usedPlayerIds={new Set(Object.values(guesses).map((g) => g.playerId))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareModalOpen && (
          <HoopgridShareModal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            imageUri={shareImageUri}
            textSummary={shareText}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
