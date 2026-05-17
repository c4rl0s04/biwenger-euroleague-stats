import { useState, useEffect } from 'react';
import { Store, Minus, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LineupPutAllOnMarketModal({ isOpen, onClose, onConfirm, loading }) {
  const [percentage, setPercentage] = useState(100);
  const predefinedPercentages = [100, 110, 120, 150];

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(percentage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-zinc-950 border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/5 pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer z-50"
        >
          <X size={18} />
        </button>

        <div className="p-8 pb-4 flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
            <Store className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">
            Alinear Mercado
          </h2>
          <p className="text-sm font-medium text-zinc-400 mt-2 px-2">
            Vas a poner a toda tu plantilla en el mercado de fichajes. Selecciona el porcentaje de
            su valor por el que quieres listarlos.
          </p>
        </div>

        <div className="py-8 space-y-6 relative z-10 flex-1">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
              Precio de Venta
            </span>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setPercentage(Math.max(50, percentage - 5))}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <Minus size={20} />
              </button>

              <div className="text-5xl font-black tabular-nums tracking-tighter text-blue-400 w-32 text-center">
                {percentage}%
              </div>

              <button
                onClick={() => setPercentage(Math.min(300, percentage + 5))}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {predefinedPercentages.map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  percentage === pct
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border-t border-white/5 flex gap-3 relative z-10 mt-auto">
          <button
            className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl h-12 font-bold transition-colors cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 rounded-xl h-12 font-black transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              'Publicar Jugadores'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
