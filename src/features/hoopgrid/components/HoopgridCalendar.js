'use client';

import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

/**
 * Calendar modal for browsing Hoopgrid challenges.
 * Days are colored by difficulty.
 */
export default function HoopgridCalendar({
  isOpen,
  onClose,
  allChallenges,
  onSelectDate,
  currentDate,
}) {
  const [viewDate, setViewDate] = useState(new Date(currentDate));

  const getComplexityColor = (comp) => {
    if (comp === undefined || comp === null) return 'transparent';
    const hue = Math.max(0, Math.min(120, 120 - comp * 1.2));
    return `hsl(${hue}, 80%, 50%)`;
  };

  // Calendar Logic
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust for Monday start: 0 (Sun) becomes 6, 1 (Mon) becomes 0
  const startOffset = (firstDayOfMonth + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(viewDate);

  const challengeMap = allChallenges.reduce((acc, ch) => {
    acc[ch.gameDate] = ch;
    return acc;
  }, {});

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display uppercase tracking-tighter text-white">
            Archivo de Retos
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={prevMonth} className="p-1 hover:text-primary transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-lg font-bold capitalize text-white">
            {monthName} {year}
          </div>
          <button onClick={nextMonth} className="p-1 hover:text-primary transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-black opacity-30 text-white pb-2"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
              2,
              '0'
            )}`;
            const ch = challengeMap[dateStr];
            const isSelected = dateStr === currentDate;
            const color = getComplexityColor(ch?.complexity);

            return (
              <button
                key={day}
                disabled={!ch}
                onClick={() => onSelectDate(dateStr)}
                className={`
                  relative aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all
                  ${ch ? 'cursor-pointer hover:scale-110' : 'opacity-10 pointer-events-none'}
                  ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 z-10' : ''}
                `}
                style={ch ? { backgroundColor: `${color}20`, color: color } : {}}
              >
                {day}
                {ch && (
                  <div
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[hsl(120,80%,50%)]" />
              <span className="text-[10px] uppercase font-bold opacity-50">Fácil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[hsl(0,80%,50%)]" />
              <span className="text-[10px] uppercase font-bold opacity-50">Difícil</span>
            </div>
          </div>
          <p className="text-[10px] italic opacity-40">Total retos: {allChallenges.length}</p>
        </div>
      </motion.div>
    </div>
  );
}
