'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RoundSelector({ rounds, currentRoundId, userId }) {
  const scrollContainerRef = useRef(null);

  // Scroll active round into view on mount
  useEffect(() => {
    if (scrollContainerRef.current && currentRoundId) {
      const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentRoundId]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; // Adjust scroll distance
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="p-2 rounded-md border text-slate-400 bg-slate-900 border-slate-800 hover:border-slate-600 hover:text-white transition-colors cursor-pointer"
        aria-label="Scroll left"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center overflow-x-auto gap-1 scrollbar-hide scroll-smooth"
      >
        {rounds.map((r) => {
          const isActive = String(r.round_id) === String(currentRoundId);
          return (
            <Link
              key={r.round_id}
              href={`/lineups?userId=${userId}&roundId=${r.round_id}`}
              scroll={false}
              data-active={isActive}
              className={`
                min-w-[3rem] px-2 py-1.5 rounded-md text-xs font-mono font-medium text-center transition-colors border flex-shrink-0
                ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                }
              `}
            >
              {r.round_name.replace('Jornada ', 'J')}
            </Link>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="p-2 rounded-md border text-slate-400 bg-slate-900 border-slate-800 hover:border-slate-600 hover:text-white transition-colors cursor-pointer"
        aria-label="Scroll right"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
