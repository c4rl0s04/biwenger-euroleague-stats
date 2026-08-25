'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Drawer
 * A reusable slide-over panel template.
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  width = 'sm:w-[700px]',
  color = 'blue',
  className = '',
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Handle Escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if (e.key !== 'Tab' || !isOpen || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
      if (isOpen) previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Color Mapping - Consistent with StatDetailDrawer
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400',
      glow: 'shadow-indigo-500/20',
    },
    fuchsia: {
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/20',
      text: 'text-fuchsia-400',
      glow: 'shadow-fuchsia-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20',
    },
    teal: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-400',
      glow: 'shadow-teal-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      glow: 'shadow-red-500/20',
    },
    pink: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      text: 'text-pink-400',
      glow: 'shadow-pink-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className={`fixed inset-x-0 bottom-0 h-[92dvh] w-full rounded-t-[1.75rem] border-t border-white/5 bg-zinc-950/95 backdrop-blur-3xl z-[201] flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.8)] sm:inset-y-0 sm:right-0 sm:left-auto sm:h-[100dvh] sm:rounded-none sm:border-t-0 sm:border-l ${width} ${className}`}
          >
            {/* Header */}
            <div className="relative p-5 sm:p-8 pb-5 sm:pb-6 border-b border-white/5 bg-zinc-900/40">
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label={`Cerrar ${title}`}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-5">
                {Icon && (
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${colors.border} ${colors.bg} ${colors.glow} shadow-lg`}
                  >
                    <Icon size={26} className={colors.text} />
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 leading-tight mb-2">
                    {subtitle || 'Ranking Completo'}
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight truncate">
                    {title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 sm:px-8 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-zinc-900/40 flex items-center justify-between shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
