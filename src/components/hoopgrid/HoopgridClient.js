'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerImage from '@/components/ui/PlayerImage';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import HoopgridSearch from './HoopgridSearch';

export default function HoopgridClient() {
  const [challenge, setChallenge] = useState(null);
  const [guesses, setGuesses] = useState({}); // { cellIndex: { ... } }
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null);
  const [copying, setCopying] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
            ...result.guess,
            playerName: player.name,
            playerImg: player.img,
            rarity: result.rarity,
            playerId: player.id,
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

  const handleShare = () => {
    let grid = 'Euroleague Hoopgrid 🏀\n';
    for (let i = 0; i < 3; i++) {
      let row = '';
      for (let j = 0; j < 3; j++) {
        const guess = guesses[i * 3 + j];
        row += guess?.isCorrect ? '🟧' : '⬜'; // Using orange for your brand
      }
      grid += row + '\n';
    }
    grid += '\nJuega en biwengerstats.com';

    navigator.clipboard.writeText(grid);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
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
      <div className="w-full flex mb-16 md:mb-20">
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
        <div className="hidden md:block md:w-[20%]"></div>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GridCell({ guess, onClick }) {
  return (
    <motion.div
      whileHover={!guess?.isCorrect ? { scale: 1.02, backgroundColor: 'hsl(var(--muted))' } : {}}
      whileTap={!guess?.isCorrect ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        relative aspect-square rounded-xl overflow-hidden cursor-pointer
        border-2 transition-all duration-500 group
        ${
          guess?.isCorrect
            ? 'border-primary/40 bg-primary/5 shadow-2xl'
            : guess?.isCorrect === false
              ? 'border-destructive/50 bg-destructive/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
              : 'border-border bg-secondary/60 shadow-inner hover:border-muted-foreground/30'
        }
      `}
    >
      {guess?.isCorrect ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-full flex flex-col items-center justify-center p-2"
        >
          <div className="relative mb-2">
            <PlayerImage
              src={guess.playerImg}
              alt={guess.playerName}
              width={112}
              height={112}
              className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-2 border-primary/20 object-cover object-top shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
              <svg
                className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <span className="text-[10px] md:text-sm lg:text-base font-black text-foreground text-center leading-tight mb-1 line-clamp-1">
            {guess.playerName?.split(',')[0]}
          </span>

          <div className="px-2 py-0.5 md:py-1 rounded-full bg-primary/10 border border-primary/20">
            <AnimatedNumber
              value={guess.rarity || 100}
              decimals={1}
              suffix="%"
              className="text-[9px] md:text-xs lg:text-sm font-mono font-bold text-primary"
            />
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
          <span className="text-[10px] font-display text-destructive">Incorrecto</span>
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
  );
}
