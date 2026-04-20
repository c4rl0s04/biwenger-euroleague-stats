'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to manage the Hoopgrid game state and API interactions.
 */
export function useHoopgridGame() {
  const [challenge, setChallenge] = useState(null);
  const [guesses, setGuesses] = useState({}); // { cellIndex: { ... } }
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null);
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
            playerId: player.id,
            playerName: player.name,
            playerImg: player.img,
            rarity: result.rarity,
            isCorrect: true,
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
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to submit board:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const correctGuessesCount = Object.values(guesses).filter((g) => g.isCorrect).length;

  return {
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
  };
}
