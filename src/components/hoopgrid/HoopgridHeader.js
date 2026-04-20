'use client';

import { Share2 } from 'lucide-react';

/**
 * Header section above the grid showing challenge info and share button.
 */
export default function HoopgridHeader({ challenge, isSubmitted, handleShare, copying }) {
  if (!challenge) return null;

  // Fix: The field in the DB is gameDate
  const challengeDate = challenge.gameDate ? new Date(challenge.gameDate) : new Date();

  const formattedDate = challengeDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate Reto number based on launch date (April 1st, 2026)
  const launchDate = new Date('2026-04-01');
  const diffTime = Math.abs(challengeDate - launchDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="w-full max-w-3xl flex justify-between items-end mb-8 px-2">
      <div className="flex flex-col">
        <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-foreground leading-none">
          Reto #{diffDays}
        </h2>
        <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-70">
          {formattedDate}
        </p>
      </div>

      {isSubmitted && (
        <button
          onClick={handleShare}
          disabled={copying}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-display text-base uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 border border-white/10"
        >
          <Share2 className="w-5 h-5" />
          {copying ? '...' : 'Compartir'}
        </button>
      )}
    </div>
  );
}
