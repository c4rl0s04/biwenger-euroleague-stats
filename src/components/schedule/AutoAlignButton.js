'use client';

import { buildAutoLineup } from '@/features/lineup/public';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { clsx } from 'clsx';
import LineupModal from './LineupModal';

/**
 * AutoAlignButton
 * Logic:
 * 1. Flatten matches to get all user players.
 * 2. Sort players by match date (Earliest first).
 * 3. Greedy selection of 5 starters (max 3 per position).
 * 4. Select captain (starter with max total points).
 * 5. Fill bench with next 5 earliest.
 * 6. Send to Biwenger via API.
 */
export default function AutoAlignButton({ matches, userName, discrete = false }) {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lineupPreview, setLineupPreview] = useState(null);

  const handleAutoAlign = async () => {
    if (!matches || matches.length === 0) {
      alert('No hay partidos para alinear.');
      return;
    }

    setLoading(true);
    try {
      const { starters, bench, captain, formationType, lineupPayload } = buildAutoLineup(matches);

      // 6. Send to API
      const result = await apiClient.saveLineup(lineupPayload);

      setLineupPreview({
        starters,
        bench,
        captain,
        formationType,
      });
      setIsModalOpen(true);
      console.log('Biwenger Response:', result);
    } catch (err) {
      console.error('AutoAlign Error:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const modal = lineupPreview && (
    <LineupModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      starters={lineupPreview.starters}
      bench={lineupPreview.bench}
      captain={lineupPreview.captain}
      formationType={lineupPreview.formationType}
      userName={userName}
    />
  );

  if (discrete) {
    return (
      <>
        <button
          onClick={handleAutoAlign}
          disabled={loading}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all duration-300',
            'bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30',
            'text-zinc-400 hover:text-indigo-400',
            'disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'
          )}
          title="Auto-Alinear Jornada"
        >
          {loading ? (
            <Loader2 className="animate-spin text-indigo-400" size={14} />
          ) : (
            <Sparkles className="text-zinc-500 group-hover:text-indigo-400" size={14} />
          )}
          <span>{loading ? 'Alineando' : 'Auto-Alinear'}</span>
        </button>
        {modal}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleAutoAlign}
        disabled={loading}
        className={clsx(
          'relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all duration-500 overflow-hidden group',
          'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700',
          'text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]',
          'hover:-translate-y-1 active:translate-y-0 active:scale-95',
          'disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed w-full lg:w-auto'
        )}
      >
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform duration-1000" />

        <div className="relative flex items-center gap-2">
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Sparkles
              className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125"
              size={20}
            />
          )}
          <span className="tracking-tight uppercase">
            {loading ? 'Procesando...' : 'Auto-Alinear'}
          </span>
        </div>
      </button>

      {modal}
    </>
  );
}
