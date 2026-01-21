'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, User, Calendar, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { getColorForUser } from '@/lib/constants/colors';

export default function ScheduleControls({ users, activeUserId, activeRoundId, rounds }) {
  const router = useRouter();

  // Find current active objects
  const activeUser = users.find((u) => String(u.id) === String(activeUserId)) || users[0];
  const activeRound = rounds.find((r) => String(r.round_id) === String(activeRoundId)) || rounds[0];

  // Helper to push URL updates
  const updateParams = (newUserId, newRoundId) => {
    const uId = newUserId ?? activeUserId;
    const rId = newRoundId ?? activeRoundId;
    router.push(`/schedule?userId=${uId}&roundId=${rId}`);
  };

  // Logic for Next/Prev Round Arrows
  const handlePrevRound = () => {
    const idx = rounds.findIndex((r) => String(r.round_id) === String(activeRoundId));
    if (idx > 0) {
      updateParams(null, rounds[idx - 1].round_id);
    }
  };

  const handleNextRound = () => {
    const idx = rounds.findIndex((r) => String(r.round_id) === String(activeRoundId));
    if (idx < rounds.length - 1) {
      updateParams(null, rounds[idx + 1].round_id);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Filtros de Vista
        </span>
      </div>

      {/* Control Bar: z-index ensures dropdowns go over sticky headers */}
      <div className="relative z-30 flex items-center p-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50 w-full max-w-2xl flex-1">
        {/* 1. USER SELECTOR */}
        <Dropdown icon={<User size={16} />} label={activeUser?.name || 'Select User'} align="left">
          {(close) => (
            <div className="p-1 min-w-[200px]">
              <div className="px-2 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 mb-1">
                Managers
              </div>
              {users.map((u) => {
                const color = getColorForUser(u.id, u.name, u.color_index);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      updateParams(u.id, null);
                      close();
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between group transition-colors my-0.5 cursor-pointer',
                      String(u.id) === String(activeUserId)
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ring-1 ring-white/10 ${color.text.replace('text-', 'bg-')}`}
                        style={{ backgroundColor: color.stroke }}
                      />
                      <span>{u.name}</span>
                    </div>
                    {String(u.id) === String(activeUserId) && (
                      <Check size={14} className="text-indigo-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Dropdown>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* 2. ROUND SELECTOR */}
        <div className="flex-1 flex items-center">
          {/* Prev Arrow */}
          <button
            onClick={handlePrevRound}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Previous Round"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Dropdown in the middle */}
          <div className="flex-1">
            <Dropdown
              icon={<Calendar size={16} />}
              label={activeRound?.round_name || 'Select Round'}
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
                          updateParams(null, r.round_id);
                          close();
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors my-0.5 cursor-pointer',
                          String(r.round_id) === String(activeRoundId)
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                        )}
                      >
                        {r.round_name}
                        {String(r.round_id) === String(activeRoundId) && (
                          <Check size={14} className="text-indigo-500" />
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
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Next Round"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Internal Dropdown Component ---
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
    <div className={clsx('relative', fullWidth && 'w-full')} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
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
          className={clsx('text-zinc-600 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* FIX: z-[100] ensures it sits above everything.
         We also keep the solid bg-zinc-950 to block content behind it.
      */}
      {isOpen && (
        <div
          className={clsx(
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
