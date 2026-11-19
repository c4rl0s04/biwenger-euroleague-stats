'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to manage the Hoopgrid game state and API interactions.
 */
export function useHoopgridGame(searchParams) {
  const router = useRouter();
  const dateParam = searchParams.get('date');

  const [challenge, setChallenge] = useState(null);
  const [guesses, setGuesses] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeCell, setActiveCell] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function fetchChallenge() {
      try {
        const url = dateParam
          ? `/api/hoopgrid/today?${new URLSearchParams({ date: dateParam })}`
          : '/api/hoopgrid/today';
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Challenge request failed (${res.status})`);
        const data = await res.json();

        if (signal.aborted) return;
        if (data.challenge) {
          setChallenge({
            ...data.challenge,
            rows:
              typeof data.challenge.rows === 'string'
                ? JSON.parse(data.challenge.rows)
                : data.challenge.rows,
            cols:
              typeof data.challenge.cols === 'string'
                ? JSON.parse(data.challenge.cols)
                : data.challenge.cols,
            possibleCounts:
              typeof data.challenge.possibleCounts === 'string'
                ? JSON.parse(data.challenge.possibleCounts)
                : data.challenge.possibleCounts,
          });

          const guessMap = {};
          let hasSavedGuesses = false;
          data.userGuesses?.forEach((g) => {
            if (g.isCorrect) {
              guessMap[g.cellIndex] = g;
              hasSavedGuesses = true;
            }
          });
          setGuesses(guessMap);
          // Only set as submitted if we have at least one guess OR if we want to show results
          setIsSubmitted(hasSavedGuesses);
        }
      } catch (err) {
        if (!signal.aborted) console.error('Failed to fetch hoopgrid:', err);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }
    void fetchChallenge();
    return () => controller.abort();
  }, [dateParam, loadAttempt]);

  const retryChallenge = () => {
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
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

  const navigateToDate = (date) => {
    const params = new URLSearchParams(searchParams);
    if (date) {
      params.set('date', date);
    } else {
      params.delete('date');
    }
    router.push(`/hoopgrid?${params.toString()}`);
  };

  // Challenge Progress Stats
  const correctGuessesCount = Object.values(guesses).filter((g) => g.isCorrect).length;

  // Reto # Logic
  const challengeDate = challenge?.gameDate ? new Date(challenge.gameDate) : new Date();
  const diffDays = challenge?.number || 0;

  // Navigation Logic
  const prevDateObj = new Date(challengeDate);
  prevDateObj.setDate(prevDateObj.getDate() - 1);
  const prevDate = prevDateObj.toISOString().split('T')[0];

  const nextDateObj = new Date(challengeDate);
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDate = nextDateObj.toISOString().split('T')[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const isLatest = challenge?.gameDate === todayStr;

  return {
    challenge,
    guesses,
    loading,
    activeCell,
    isSubmitted,
    submitting,
    correctGuessesCount,
    challengeDate,
    rawGameDate: challenge?.gameDate,
    complexity: challenge?.complexity || 0,
    diffDays,
    prevDate,
    nextDate,
    isLatest,
    setActiveCell,
    handleGuess,
    handleSubmitBoard,
    navigateToDate,
    retryChallenge,
  };
}
