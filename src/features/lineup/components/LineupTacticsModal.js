'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FORMATIONS = [
  '2-2-1',
  '1-2-2',
  '2-1-2',
  '1-3-1',
  '3-1-1',
  '2-3-0',
  '3-2-0',
  '1-1-3',
  '2-0-3',
  '0-2-3',
  '0-3-2',
  '3-0-2',
];

export default function LineupTacticsModal({ isOpen, onClose, currentType, onSelect }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Estrategia</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2">
            {FORMATIONS.map((type, index) => {
              const isSelected = type === currentType;

              return (
                <button
                  key={type}
                  onClick={() => {
                    onSelect(type);
                    onClose();
                  }}
                  className={`
                    p-6 text-center text-lg font-bold transition-all border-b border-border cursor-pointer
                    ${index % 2 === 0 ? 'border-r' : ''}
                    ${isSelected ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'}
                  `}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-black/20 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Bases - Aleros/Escoltas - Pivots
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
