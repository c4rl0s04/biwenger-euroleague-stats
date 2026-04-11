'use client';

import React, { useEffect } from 'react';
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
  // Handle Escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
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
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className={`fixed top-0 right-0 h-screen w-full ${width} bg-zinc-950/95 backdrop-blur-3xl border-l border-white/5 z-[201] flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.8)] ${className}`}
          >
            {/* Header */}
            <div className="relative p-8 pb-6 border-b border-white/5 bg-zinc-900/40">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-zinc-500 hover:text-white cursor-pointer"
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
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-8 py-3 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between shrink-0">
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
