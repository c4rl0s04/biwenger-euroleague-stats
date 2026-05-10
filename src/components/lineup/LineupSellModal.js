'use client';

import { useState } from 'react';
import { X, Minus, Plus, Gavel, Zap, HandCoins, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/format';
import Image from 'next/image';

const TABS = [
  { id: 'vender', label: 'Vender', icon: HandCoins },
  { id: 'inmediata', label: 'Venta inmediata', icon: Zap },
  { id: 'subasta', label: 'Subasta', icon: Gavel },
  { id: 'cedible', label: 'Cedible', icon: UserPlus },
];

export default function LineupSellModal({ isOpen, onClose, player, onConfirm }) {
  const [activeTab, setActiveTab] = useState('vender');
  const [sellPrice, setSellPrice] = useState(player?.price || 0);

  if (!isOpen || !player) return null;

  const handlePriceChange = (amount) => {
    setSellPrice((prev) => Math.max(0, prev + amount));
  };

  // Position theme colors (Matching the rest of the app)
  const positionThemes = {
    Base: 'text-blue-400 border-blue-400/30 bg-blue-400/10 shadow-blue-500/20',
    Alero: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 shadow-emerald-500/20',
    Pivot: 'text-rose-400 border-rose-400/30 bg-rose-400/10 shadow-rose-500/20',
  };
  const theme = positionThemes[player.position] || positionThemes.Base;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-xl bg-zinc-950 border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer z-50"
          >
            <X size={20} />
          </button>

          {/* Player Header */}
          <div className="p-10 pb-6 flex flex-col items-center text-center">
            <div
              className={`relative w-28 h-28 rounded-full border-2 ${theme} p-1 mb-4 shadow-2xl`}
            >
              <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden relative">
                {player.img && (
                  <Image
                    src={player.img}
                    alt={player.name}
                    fill
                    className="object-cover object-top scale-[1.6] origin-top pt-2"
                  />
                )}
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-1">
              {player.name}
            </h2>
            <p className="text-zinc-400 font-bold text-lg">{formatCurrency(player.price)}</p>
          </div>

          {/* Custom Tabs */}
          <div className="px-6 flex items-center justify-between border-b border-white/5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex flex-col items-center gap-2 py-4 px-2 transition-all relative cursor-pointer
                    ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Price Selector */}
          <div className="p-10 space-y-10">
            <div className="flex flex-col items-center gap-6">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">
                Precio de Venta
              </span>

              <div className="flex items-center gap-8">
                <button
                  onClick={() => handlePriceChange(-10000)}
                  className="w-14 h-14 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-all text-white cursor-pointer active:scale-90"
                >
                  <Minus size={24} />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tracking-tight">
                    {formatCurrency(sellPrice)}
                  </span>
                  <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4" />
                </div>

                <button
                  onClick={() => handlePriceChange(10000)}
                  className="w-14 h-14 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-all text-white cursor-pointer active:scale-90"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button className="w-full py-5 rounded-2xl bg-zinc-900 border border-white/5 text-white font-black uppercase tracking-widest hover:bg-zinc-800 transition-all cursor-pointer text-sm">
                Añadir Jugador
              </button>

              <button
                onClick={() => onConfirm?.(player, sellPrice)}
                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition-all cursor-pointer text-sm shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
              >
                Poner en Venta
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
