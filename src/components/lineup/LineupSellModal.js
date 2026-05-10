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

  // Position theme colors
  const positionThemes = {
    Base: 'border-blue-400/50 shadow-blue-500/10',
    Alero: 'border-emerald-400/50 shadow-emerald-500/10',
    Pivot: 'border-rose-400/50 shadow-rose-500/10',
  };
  const theme = positionThemes[player.position] || positionThemes.Base;

  const getButtonStyles = () => {
    switch (activeTab) {
      case 'vender':
        return 'bg-white text-black hover:bg-zinc-200';
      case 'inmediata':
        return 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20';
      case 'subasta':
        return 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20';
      case 'cedible':
        return 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20';
      default:
        return 'bg-white text-black';
    }
  };

  const getButtonLabel = () => {
    switch (activeTab) {
      case 'vender':
        return 'Poner en Venta';
      case 'inmediata':
        return 'Venta Inmediata';
      case 'subasta':
        return 'Iniciar Subasta';
      case 'cedible':
        return 'Cesión';
      default:
        return 'Confirmar';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
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
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer z-50"
          >
            <X size={18} />
          </button>

          <div className="p-8 pb-4 flex flex-col items-center text-center">
            <div className={`relative w-20 h-20 rounded-full border ${theme} p-0.5 mb-3`}>
              <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden relative">
                {player.img && (
                  <Image
                    src={player.img}
                    alt={player.name}
                    fill
                    className="object-cover object-top scale-[1.6] origin-top pt-1"
                  />
                )}
              </div>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              {player.name}
            </h2>
            <p className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(player.price)}
            </p>
          </div>

          <div className="px-4 flex items-center justify-between border-b border-white/5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex flex-col items-center gap-1.5 py-3 px-1 transition-all relative cursor-pointer
                    ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}
                  `}
                >
                  <Icon size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                    {tab.label.split(' ')[0]}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <motion.div layout className="p-8">
            <AnimatePresence mode="wait">
              {(activeTab === 'vender' || activeTab === 'subasta') && (
                <motion.div
                  key="price-selector"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center gap-4 mb-8 overflow-hidden"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Precio Sugerido
                  </span>

                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handlePriceChange(-10000)}
                      className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-all text-white cursor-pointer"
                    >
                      <Minus size={18} />
                    </button>

                    <span className="text-3xl font-black text-white tracking-tight min-w-[140px] text-center">
                      {formatCurrency(sellPrice)}
                    </span>

                    <button
                      onClick={() => handlePriceChange(10000)}
                      className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-all text-white cursor-pointer"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeTab === 'vender' && sellPrice < player.price && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] font-black uppercase tracking-widest text-rose-400 text-center mb-4"
                >
                  El precio no puede ser menor al valor de mercado
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              layout
              disabled={activeTab === 'vender' && sellPrice < player.price}
              onClick={() => onConfirm?.(player, sellPrice)}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all cursor-pointer text-xs shadow-lg ${
                activeTab === 'vender' && sellPrice < player.price
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  : getButtonStyles()
              }`}
            >
              {getButtonLabel()}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
