'use client';

import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

// Hooks
import { useHoopgridGame } from '@/hooks/hoopgrid/useHoopgridGame';
import { useHoopgridShare } from '@/hooks/hoopgrid/useHoopgridShare';

// Components
import HoopgridHeader from './HoopgridHeader';
import HoopgridStats from './HoopgridStats';
import HoopgridBoard from './HoopgridBoard';
import HoopgridInstructions from './HoopgridInstructions';
import HoopgridSearch from './HoopgridSearch';
import HoopgridShareModal from './HoopgridShareModal';

/**
 * Main Hoopgrid Orchestrator.
 * Symmetrical and Modular.
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
    challengeDate,
    diffDays,
    prevDate,
    nextDate,
    isLatest,
    setActiveCell,
    handleGuess,
    handleSubmitBoard,
    navigateToDate,
  } = useHoopgridGame();

  // 2. Share Engine (Symmetrical Centering)
  const { copying, shareModalOpen, shareImageUri, shareText, setShareModalOpen, handleShare } =
    useHoopgridShare(gridRef, guesses, currentUser);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="w-full flex flex-col items-center pt-12">
      {/* 1. Header Section */}
      <HoopgridHeader
        diffDays={diffDays}
        challengeDate={challengeDate}
        prevDate={prevDate}
        nextDate={nextDate}
        isLatest={isLatest}
        onNavigate={navigateToDate}
      />

      {/* 2. Stats Section */}
      <HoopgridStats guesses={guesses} correctGuessesCount={correctGuessesCount} />

      {/* 3. The Interactive Board */}
      <HoopgridBoard
        gridRef={gridRef}
        challenge={challenge}
        guesses={guesses}
        setActiveCell={setActiveCell}
        isSubmitted={isSubmitted}
        currentUser={currentUser}
      />

      {/* 4. Action Toolbar */}
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

        {isSubmitted && (
          <button
            onClick={handleShare}
            disabled={copying}
            className="px-10 py-4 bg-indigo-600 text-white font-display text-xl uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-3 border border-white/10"
          >
            <Share2 className="w-6 h-6" />
            {copying ? 'Generando...' : 'Compartir Resultados'}
          </button>
        )}
      </div>

      {/* 5. Rules Footer */}
      <HoopgridInstructions />

      {/* 6. Modals */}
      <AnimatePresence mode="wait">
        {activeCell !== null && (
          <HoopgridSearch
            key="search-modal"
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

      <AnimatePresence mode="wait">
        {shareModalOpen && (
          <HoopgridShareModal
            key="share-modal"
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
