import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Store, TrendingUp, HandCoins, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LineupPutAllOnMarketModal({ isOpen, onClose, onConfirm, loading }) {
  const [percentage, setPercentage] = useState(100);

  const predefinedPercentages = [100, 110, 120, 150];

  const handleConfirm = () => {
    onConfirm(percentage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border border-white/10 text-white rounded-3xl p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/5 pointer-events-none" />

        <div className="p-6 relative">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 mx-auto shadow-lg shadow-blue-500/20">
              <Store className="w-8 h-8 text-blue-400" />
            </div>
            <DialogTitle className="text-2xl font-black text-center tracking-tight">
              Alinear Mercado
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-400 font-medium">
              Vas a poner a toda tu plantilla en el mercado de fichajes. Selecciona el porcentaje de
              su valor por el que quieres listarlos.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
                Precio de Venta
              </span>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setPercentage(Math.max(50, percentage - 5))}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <Minus size={20} />
                </button>

                <div className="text-5xl font-black tabular-nums tracking-tighter text-blue-400 w-32 text-center">
                  {percentage}%
                </div>

                <button
                  onClick={() => setPercentage(Math.min(300, percentage + 5))}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
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
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
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
        </div>

        <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3 relative">
          <Button
            variant="outline"
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl h-12 font-bold"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 rounded-xl h-12 font-black"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              'Publicar Jugadores'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
