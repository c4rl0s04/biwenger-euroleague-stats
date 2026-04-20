'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import PlayerImage from '@/components/ui/PlayerImage';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import HoopgridSearch from './HoopgridSearch';
import HoopgridShareModal from './HoopgridShareModal';
import { useUser } from '@/contexts/UserContext';

export default function HoopgridClient() {
  const [challenge, setChallenge] = useState(null);
  const [guesses, setGuesses] = useState({}); // { cellIndex: { ... } }
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null);
  const [copying, setCopying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareImageUri, setShareImageUri] = useState(null);
  const [shareText, setShareText] = useState('');
  const gridRef = useRef(null);
  const { currentUser } = useUser();

  useEffect(() => {
    fetchTodayChallenge();
  }, []);

  const fetchTodayChallenge = async () => {
    try {
      const res = await fetch('/api/hoopgrid/today');
      const data = await res.json();

      if (data.challenge) {
        setChallenge(data.challenge);
        const guessMap = {};
        let hasSavedGuesses = false;
        data.userGuesses?.forEach((g) => {
          if (g.isCorrect) {
            guessMap[g.cellIndex] = g;
            hasSavedGuesses = true;
          }
        });
        setGuesses(guessMap);
        if (hasSavedGuesses) setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to fetch hoopgrid:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = async (player) => {
    if (activeCell === null) return false;

    try {
      const res = await fetch('/api/hoopgrid/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          cellIndex: activeCell,
          playerId: player.id,
          dryRun: true,
        }),
      });

      const result = await res.json();

      if (result.error) {
        console.error('Submission failed:', result.error);
        return false;
      }

      if (result.isCorrect) {
        setGuesses((prev) => ({
          ...prev,
          [activeCell]: {
            playerId: player.id,
            playerName: player.name,
            playerImg: player.img,
            rarity: result.rarity,
            isCorrect: true, // Explicitly set this for immediate styling
          },
        }));
        setActiveCell(null);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Submission failed:', err);
      return false;
    }
  };

  const handleSubmitBoard = async () => {
    if (Object.keys(guesses).length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/hoopgrid/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          action: 'submitBatch',
          guesses,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit board:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    // ─── SHARE CARD LAYOUT CONSTANTS ──────────────────────────────────────────
    // Tweak these values to adjust the generated image layout:
    const CARD_WIDTH = 1000; // Total image width in pixels
    const CARD_HEIGHT = 1000; // Force a 1:1 square to prevent bottom cut-off
    const CARD_PADDING = 40; // Outer padding around the entire card (px)
    const CARD_BORDER_RADIUS = 24; // Rounded corners on the card (px)
    const LEFT_COL_WIDTH = 180; // Wider so team names (e.g. Valencia Basket) don't wrap
    const CENTER_COL_WIDTH = 720; // Width of the 3x3 grid (px)
    const RIGHT_COL_WIDTH = 100; // Less empty space on the right
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Text Summary
    let gridText = 'Euroleague Hoopgrid 🏀\n';
    for (let i = 0; i < 3; i++) {
      let row = '';
      for (let j = 0; j < 3; j++) {
        const guess = guesses[i * 3 + j];
        row += guess?.isCorrect ? '🟧' : '⬜';
      }
      gridText += row + '\n';
    }
    gridText += '\nJuega en biwengerstats.com';
    setShareText(gridText);

    // 2. Image Generation
    if (gridRef.current) {
      try {
        setCopying(true);
        const bgColor =
          getComputedStyle(document.documentElement).getPropertyValue('--background') || '#0f172a';

        const dataUrl = await toPng(gridRef.current, {
          cacheBust: true,
          backgroundColor: bgColor.trim(),
          width: CARD_WIDTH,
          height: CARD_HEIGHT, // Forces the capture engine to use a 1000x1000 canvas
          style: {
            borderRadius: `${CARD_BORDER_RADIUS}px`,
            padding: `${CARD_PADDING}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center', // Centers the grid vertically inside the new square
          },
          onClone: (clonedDoc) => {
            const footer = clonedDoc.querySelector('.share-only-footer');
            if (footer) footer.style.display = 'flex';

            const mainContainer = clonedDoc.querySelector('.hoopgrid-main-container');
            if (mainContainer) {
              mainContainer.style.width = '100%';
              mainContainer.style.display = 'flex';
              mainContainer.style.flexWrap = 'nowrap';

              const leftCol = mainContainer.children[0];
              if (leftCol) {
                leftCol.style.width = `${LEFT_COL_WIDTH}px`;
                leftCol.style.minWidth = `${LEFT_COL_WIDTH}px`;
              }

              const centerCol = mainContainer.children[1];
              if (centerCol) {
                centerCol.style.width = `${CENTER_COL_WIDTH}px`;
                centerCol.style.minWidth = `${CENTER_COL_WIDTH}px`;
              }

              const rightCol = mainContainer.children[2];
              if (rightCol) {
                rightCol.style.display = 'block';
                rightCol.style.width = `${RIGHT_COL_WIDTH}px`;
                rightCol.style.minWidth = `${RIGHT_COL_WIDTH}px`;
              }
            }
          },
        });
        setShareImageUri(dataUrl);
        setShareModalOpen(true);
      } catch (err) {
        console.error('Failed to generate image:', err);
      } finally {
        setCopying(false);
      }
    }
  };

  const correctGuessesCount = Object.values(guesses).filter((g) => g.isCorrect).length;
  const totalGuessesCount = Object.keys(guesses).length;

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-muted-foreground">
        Cargando desafío de hoy...
      </div>
    );
  if (!challenge)
    return (
      <div className="p-20 text-center text-muted-foreground text-lg">
        No hay desafío disponible hoy. Vuelve pronto.
      </div>
    );

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center mt-12 md:mt-16">
      {/* 0. Status Header */}
      <div className="w-full flex justify-between items-end mb-8 px-4 bg-card/40 p-6 md:p-8 rounded-2xl border border-border/50 backdrop-blur-sm shadow-2xl">
        <div>
          <h2 className="text-3xl md:text-4xl font-display text-foreground tracking-tighter">
            EUROLEAGUE GRID
          </h2>
          <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-[0.2em] mt-1">
            {new Date().toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-6 md:gap-8">
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-secondary-foreground text-[10px] md:text-xs font-bold uppercase transition-colors"
          >
            {copying ? '¡Copiado!' : 'Compartir'}
          </button>
          <div className="text-right">
            <div className="text-4xl md:text-5xl font-display text-primary leading-none">
              {correctGuessesCount}/9
            </div>
            <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-tighter mt-1">
              Aciertos
            </p>
          </div>
        </div>
      </div>

      {/* 1. The Grid Container */}
      <div ref={gridRef} className="hoopgrid-main-container w-full flex flex-wrap mb-16 md:mb-20">
        {/* Left Column: Row Headers */}
        <div className="w-[25%] md:w-[20%] flex flex-col pt-8 md:pt-14 pr-2 md:pr-6">
          {challenge.rows.map((row, i) => (
            <div
              key={`row-${i}`}
              className="flex-1 flex items-center justify-end text-right text-xs sm:text-sm md:text-lg lg:text-xl font-display text-muted-foreground leading-none uppercase"
            >
              {row.label}
            </div>
          ))}
        </div>

        {/* Center: Column Headers + 3x3 Grid */}
        <div className="w-[75%] md:w-[60%] flex flex-col">
          {/* Column Headers */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-4 h-8 md:h-14">
            {challenge.cols.map((col, i) => (
              <div
                key={`col-${i}`}
                className="flex items-end justify-center text-center text-xs sm:text-sm md:text-lg lg:text-xl font-display text-muted-foreground leading-tight uppercase pb-1 md:pb-2"
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* 3x3 Board */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 aspect-square">
            {[0, 1, 2].map((rowIdx) => (
              <div key={`row-group-${rowIdx}`} className="contents">
                {[0, 1, 2].map((colIdx) => {
                  const cellIndex = rowIdx * 3 + colIdx;
                  const guess = guesses[cellIndex];

                  return (
                    <GridCell
                      key={`cell-${cellIndex}`}
                      guess={guess}
                      onClick={() => !isSubmitted && setActiveCell(cellIndex)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Empty spacer to perfectly center the board on desktop */}
        <div className="w-[25%] md:w-[20%] hidden md:block"></div>

        {/* GHOST FOOTER: Only visible in the shared image */}
        <div className="share-only-footer hidden w-full max-w-4xl mt-12 flex justify-between items-center px-4 opacity-40">
          <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
            biwengerstats.com
          </span>
          <span className="text-[12px] font-display uppercase tracking-tighter text-foreground">
            Manager: {currentUser?.name || 'Invitado'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {!isSubmitted && correctGuessesCount > 0 && (
        <div className="w-full flex justify-center mb-8">
          <button
            onClick={handleSubmitBoard}
            disabled={submitting}
            className="px-8 py-3 bg-primary text-primary-foreground font-display text-lg uppercase tracking-widest rounded-xl shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'Guardando...' : 'Finalizar Cuadrícula'}
          </button>
        </div>
      )}

      {/* 2. Instructions */}
      <div className="w-full max-w-lg bg-card/30 p-8 rounded-2xl border border-border/50 mb-10">
        <h3 className="text-foreground font-display mb-4 text-sm tracking-widest">Cómo jugar</h3>
        <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
          <li className="flex gap-3">
            <span className="text-primary font-bold">01.</span>
            <span>Busca un jugador que cumpla con los dos criterios (fila y columna).</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">02.</span>
            <span>
              Tienes <strong>intentos ilimitados</strong> para encontrar al jugador correcto.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">03.</span>
            <span>
              El <strong>Rarity Score</strong> premia a los jugadores menos seleccionados por otros
              usuarios.
            </span>
          </li>
        </ul>
      </div>

      {/* 3. Search Modal */}
      <AnimatePresence>
        {activeCell !== null && (
          <HoopgridSearch
            onClose={() => setActiveCell(null)}
            onSelect={handleGuess}
            title={`${challenge.rows[Math.floor(activeCell / 3)].label} + ${challenge.cols[activeCell % 3].label}`}
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

function GridCell({ guess, onClick }) {
  // Direct HEX color map for maximum reliability
  const getRarityColor = (rarity) => {
    if (rarity === null || rarity === undefined) return '#2563eb'; // Selection Blue
    if (rarity <= 1) return '#ffffff'; // Rainbow/White
    if (rarity <= 5) return '#9333ea'; // Purple
    if (rarity <= 15) return '#2563eb'; // Blue
    if (rarity <= 30) return '#eab308'; // Gold
    if (rarity <= 50) return '#e2e8f0'; // Silver
    return '#ea580c'; // Bronze (Orange-600)
  };

  const isCorrect = !!guess?.isCorrect;
  const rarityColor = isCorrect ? getRarityColor(guess.rarity) : null;

  return (
    <>
      <style jsx global>{`
        @keyframes rainbow-border {
          0% {
            border-color: #ff0000;
          }
          33% {
            border-color: #00ff00;
          }
          66% {
            border-color: #0000ff;
          }
          100% {
            border-color: #ff0000;
          }
        }
        .animate-rainbow-border {
          animation: rainbow-border 2s linear infinite;
        }
      `}</style>

      <motion.div
        whileHover={!isCorrect ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
        whileTap={!isCorrect ? { scale: 0.98 } : {}}
        onClick={onClick}
        style={{
          backgroundColor: rarityColor || undefined,
          color: guess?.rarity <= 50 && isCorrect && guess?.rarity > 30 ? '#0f172a' : 'inherit',
        }}
        className={`
          relative aspect-square rounded-xl overflow-hidden cursor-pointer
          border-2 transition-all duration-300 group
          ${isCorrect && guess.rarity <= 1 ? 'animate-rainbow-border shadow-xl' : 'border-white/10'}
          ${!isCorrect ? 'bg-white/5 shadow-inner' : ''}
          ${guess?.isCorrect === false ? 'border-destructive bg-destructive/20' : ''}
        `}
      >
        {guess?.isCorrect ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-end relative"
          >
            {/* Player Image - Large & Faded into background */}
            <div className="absolute inset-0 flex items-center justify-center pt-2">
              <PlayerImage
                src={guess.playerImg}
                alt={guess.playerName}
                width={140}
                height={140}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                hideFallback={true}
              />
              {/* Very subtle gradient for text readability only */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            {/* Name & Rarity Bubble */}
            <div className="relative z-10 w-full p-2 flex flex-col items-center gap-1.5">
              <span className="text-[10px] md:text-[11px] font-black text-white text-center leading-tight line-clamp-1 drop-shadow-md">
                {guess.playerName?.split(',')[0]}
              </span>

              <div className="px-2 py-0.5 rounded-full bg-primary shadow-lg border border-primary-foreground/10">
                <AnimatedNumber
                  value={guess.rarity || 100}
                  decimals={1}
                  suffix="%"
                  className="text-[9px] md:text-[10px] font-mono font-bold text-primary-foreground"
                />
              </div>
            </div>
          </motion.div>
        ) : guess?.isCorrect === false ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center p-2"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-destructive/30 flex items-center justify-center mb-1">
              <svg
                className="w-6 h-6 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <span className="text-[10px] font-display text-destructive uppercase tracking-widest font-black">
              Incorrecto
            </span>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
