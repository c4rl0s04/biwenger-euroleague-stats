'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dropdown({ icon, label, children, align = 'left', fullWidth = false, className }) {
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
    <div className={cn('relative', fullWidth && 'w-full', className)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
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
          className={cn('text-zinc-600 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 z-[999] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl shadow-black overflow-hidden min-w-[240px] animate-in fade-in zoom-in-95 duration-100',
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
