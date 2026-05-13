'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Info, TrendingUp, TrendingDown, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import Image from 'next/image';

export default function LineupOfferModal({
  isOpen,
  onClose,
  player,
  offer,
  actionType,
  onConfirm,
  loading,
  isSimulationMode,
}) {
  if (!isOpen || !player || !offer) return null;

  const isAccept = actionType === 'accept';

  // Calculations
  const purchasePrice = player.owner?.price || 0;
  const offerAmount = offer.amount;
  const totalProfit = offerAmount - purchasePrice;
  const profitPercent = purchasePrice > 0 ? ((totalProfit / purchasePrice) * 100).toFixed(1) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header Status Bar */}
          <div className={`h-1.5 w-full ${isAccept ? 'bg-emerald-500' : 'bg-rose-500'}`} />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Simulation Banner */}
            {isSimulationMode && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 mb-2">
                <ShieldCheck size={18} className="shrink-0" />
                <div className="text-[11px] font-bold uppercase tracking-wider">
                  Modo Simulación Activo:{' '}
                  <span className="text-white/80">No se enviarán datos a Biwenger.</span>
                </div>
              </div>
            )}

            {/* Title & Close */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {isAccept ? 'Aceptar Oferta' : 'Rechazar Oferta'}
                </h2>
                <p className="text-zinc-500 text-sm font-medium">
                  {isAccept
                    ? '¿Estás seguro de vender a este jugador?'
                    : '¿Quieres descartar esta oferta de mercado?'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Player Info Card */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="relative w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden border border-white/5">
                <div className="relative w-full h-full pt-2 scale-[1.7] origin-top">
                  <Image
                    src={
                      player.img ||
                      `https://biwenger.as.com/resources/images/players/full/${player.id}.png`
                    }
                    alt={player.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white">{player.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Oferta Recibida:
                  </span>
                  <span
                    className={`text-lg font-black ${isAccept ? 'text-emerald-400' : 'text-zinc-300'}`}
                  >
                    {formatCurrency(offerAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Impact (Only for Accept) */}
            {isAccept && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                    Inversión
                  </span>
                  <div className="text-base font-bold text-zinc-300">
                    {formatCurrency(purchasePrice)}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-2xl border space-y-1 ${totalProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}
                >
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                    Beneficio Real
                  </span>
                  <div
                    className={`text-base font-black flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {totalProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatCurrency(totalProfit)}
                  </div>
                </div>
              </div>
            )}

            {/* Warning Message */}
            <div className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-2xl border border-white/5">
              <Info size={18} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isAccept
                  ? 'Al aceptar, el jugador será vendido inmediatamente. Esta acción no se puede deshacer desde este panel.'
                  : 'Al rechazar, la oferta desaparecerá de tu lista. Tendrás que esperar a que el mercado genere una nueva.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all font-bold uppercase tracking-widest text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => onConfirm(player, offer)}
                disabled={loading}
                className={`flex-[2] py-4 rounded-2xl text-white transition-all font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 ${
                  isAccept
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isAccept ? <Check size={18} /> : <X size={18} />}
                    {isAccept ? 'Confirmar Venta' : 'Confirmar Rechazo'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
