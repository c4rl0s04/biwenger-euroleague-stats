'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
} from 'lucide-react';

const mockPlayer = {
  id: 1,
  name: 'Facundo Campazzo',
  position: 'Base',
  team: 'Real Madrid',
  team_img: 'https://images.euroleague.net/teams/MAD/Real_Madrid.png',
  img: 'https://images.euroleague.net/player/Facundo_Campazzo.png',
  price: 18500000,
  average: 15.4,
  recentForm: [12, 18, 14, 22, 15],
  nextMatches: [
    {
      team: 'Olympiacos',
      img: 'https://images.euroleague.net/teams/OLY/Olympiacos.png',
      diff: 'hard',
      loc: 'Away',
    },
    {
      team: 'ALBA Berlin',
      img: 'https://images.euroleague.net/teams/BER/Alba_Berlin.png',
      diff: 'easy',
      loc: 'Home',
    },
    {
      team: 'Monaco',
      img: 'https://images.euroleague.net/teams/MON/Monaco.png',
      diff: 'medium',
      loc: 'Home',
    },
  ],
  stats: {
    floor: 8,
    ceiling: 32,
    minutesAvg: 26.5,
    minutesTrend: '+2.1',
    gamesPlayed: '21/24',
    playoffProb: 98,
    teamStreak: 'W-W-L',
  },
};

export default function AnalyticsDemoShowroom() {
  const [activeView, setActiveView] = useState(null); // 'modal', 'drawer', 'expand'

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-[#111318] border border-white/20 p-4 rounded-xl shadow-2xl flex flex-col gap-3 max-w-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
        <h3 className="font-bold text-white text-sm">Prototipos Nivel 2</h3>
        <button onClick={() => setActiveView(null)} className="text-white/40 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <p className="text-xs text-white/60 leading-tight">
        Prueba las 3 opciones de interfaz para las analíticas profundas del jugador.
      </p>

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={() => setActiveView('modal')}
          className="px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition-colors text-left flex items-center justify-between"
        >
          <span>Opción A: Modal Centro</span>
          <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded">Inmersivo</span>
        </button>
        <button
          onClick={() => setActiveView('drawer')}
          className="px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-semibold hover:bg-emerald-500/30 transition-colors text-left flex items-center justify-between"
        >
          <span>Opción B: Panel Lateral</span>
          <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Productivo</span>
        </button>
        <button
          onClick={() => setActiveView('expand')}
          className="px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-semibold hover:bg-purple-500/30 transition-colors text-left flex items-center justify-between"
        >
          <span>Opción C: Expansión Carta</span>
          <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded">Magia UI</span>
        </button>
      </div>

      <AnimatePresence>
        {activeView === 'modal' && <ModalView onClose={() => setActiveView(null)} />}
        {activeView === 'drawer' && <DrawerView onClose={() => setActiveView(null)} />}
        {activeView === 'expand' && <ExpandView onClose={() => setActiveView(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ========================
// OPTION A: CENTER MODAL
// ========================
function ModalView({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
      >
        {/* Header Hero */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="h-32 bg-blue-900/30 relative flex items-end px-8 pb-4">
          {/* Mock avatar overlap */}
          <div className="w-24 h-24 bg-blue-900 rounded-xl overflow-hidden translate-y-8 border-4 border-[#0b0c10] shadow-lg flex-shrink-0"></div>
          <div className="ml-6 mb-1 text-white flex-1 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black">{mockPlayer.name}</h2>
              <p className="text-blue-400 font-medium">Real Madrid • {mockPlayer.position}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs uppercase mb-1">Precio Actual</p>
              <p className="text-2xl font-bold">18.5M €</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-12 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Col */}
          <div className="col-span-1 space-y-6">
            <div className="bg-[#111318] p-4 rounded-xl border border-white/5">
              <h4 className="text-xs text-white/50 font-bold mb-3 uppercase flex items-center">
                <Activity size={14} className="mr-2" /> Performance Base
              </h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">Media Pts</span>
                <strong className="text-emerald-400">{mockPlayer.average}</strong>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70">Minutos</span>
                <strong className="text-white">
                  26.5m <span className="text-green-400 text-xs ml-1">(+2)</span>
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Asistencia</span>
                <strong className="text-white">21/24</strong>
              </div>
            </div>
            <div className="bg-[#111318] p-4 rounded-xl border border-white/5">
              <h4 className="text-xs text-white/50 font-bold mb-3 uppercase flex items-center">
                <BarChart3 size={14} className="mr-2" /> Fiabilidad (Techo/Suelo)
              </h4>
              <div className="relative h-4 bg-white/10 rounded-full mt-6 mb-2">
                <div className="absolute top-1/2 -translate-y-1/2 -mt-5 left-[10%] text-xs text-white/50">
                  8 (Min)
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -mt-5 left-[80%] text-xs text-white/50">
                  32 (Max)
                </div>
                <div
                  className="absolute inset-y-0 bg-emerald-500/50 rounded-full"
                  style={{ left: '20%', right: '10%' }}
                ></div>
                <div className="absolute inset-y-0 w-1 bg-white" style={{ left: '40%' }}></div>
              </div>
            </div>
          </div>

          {/* Right Col */}
          <div className="col-span-2 space-y-6">
            <div className="bg-[#111318] p-5 rounded-xl border border-white/5">
              <h4 className="text-xs text-white/50 font-bold mb-4 uppercase flex items-center">
                <Calendar size={14} className="mr-2" /> Calendario FAS (Próx 3)
              </h4>
              <div className="flex gap-3">
                <div className="flex-1 bg-red-900/20 border border-red-500/20 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-[10px] text-white/40 mb-1">Rnd 25 • Away</span>
                  <div className="w-8 h-8 bg-white/10 rounded-full mb-2"></div>
                  <span className="text-xs font-bold text-white mb-2">OLY</span>
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                    Difícil
                  </span>
                </div>
                <div className="flex-1 bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-[10px] text-white/40 mb-1">Rnd 26 • Home</span>
                  <div className="w-8 h-8 bg-white/10 rounded-full mb-2"></div>
                  <span className="text-xs font-bold text-white mb-2">ALB</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                    Fácil
                  </span>
                </div>
                <div className="flex-1 bg-amber-900/20 border border-amber-500/20 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-[10px] text-white/40 mb-1">Rnd 27 • Home</span>
                  <div className="w-8 h-8 bg-white/10 rounded-full mb-2"></div>
                  <span className="text-xs font-bold text-white mb-2">MON</span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                    Medio
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#111318] p-5 rounded-xl border border-white/5 flex gap-6">
              <div className="flex-1">
                <h4 className="text-xs text-white/50 font-bold mb-2 uppercase">Racha Equipo</h4>
                <div className="flex gap-1">
                  <span className="w-6 h-6 flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
                    V
                  </span>
                  <span className="w-6 h-6 flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
                    V
                  </span>
                  <span className="w-6 h-6 flex items-center justify-center bg-red-500/20 text-red-400 text-xs font-bold rounded">
                    D
                  </span>
                </div>
              </div>
              <div className="flex-1 border-l border-white/10 pl-6">
                <h4 className="text-xs text-white/50 font-bold mb-2 uppercase">Opciones Playoff</h4>
                <div className="text-2xl font-bold text-sky-400">
                  98% <span className="text-xs text-white/40 font-normal">Clasificado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========================
// OPTION B: RIGHT DRAWER
// ========================
function DrawerView({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0b0c10] border-l border-white/10 h-full overflow-y-auto flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0b0c10]/90 backdrop-blur z-10">
          <h2 className="text-lg font-bold text-white">Análisis: {mockPlayer.name}</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Section 1 */}
          <div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
              Rendimiento Core
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111318] border border-white/5 p-3 rounded-lg">
                <div className="text-[10px] text-white/50 uppercase">Media Pts</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">15.4</div>
              </div>
              <div className="bg-[#111318] border border-white/5 p-3 rounded-lg">
                <div className="text-[10px] text-white/50 uppercase">Minutos Avg</div>
                <div className="text-xl font-bold text-white mt-1">
                  26.5 <span className="text-xs text-green-400">↑</span>
                </div>
              </div>
              <div className="col-span-2 bg-[#111318] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                <div className="text-[10px] text-white/50 uppercase">Rango (Suelo - Techo)</div>
                <div className="text-white font-mono text-sm bg-white/5 px-2 py-1 rounded">
                  8 - 32 pts
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Section 2 */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">
              Contexto Equipo (R. Madrid)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#111318] border border-white/5 p-3 rounded-lg">
                <div className="text-sm text-white/70">Opciones Playoff</div>
                <div className="text-white font-bold text-lg">98%</div>
              </div>
              <div className="flex justify-between items-center bg-[#111318] border border-white/5 p-3 rounded-lg">
                <div className="text-sm text-white/70">Racha Actual</div>
                <div className="flex gap-1">
                  <span className="w-5 h-5 flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                    V
                  </span>
                  <span className="w-5 h-5 flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                    V
                  </span>
                  <span className="w-5 h-5 flex items-center justify-center bg-red-500/20 text-red-400 text-[10px] font-bold rounded">
                    D
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Section 3 */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
              Calendario a corto plazo
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-red-900/10 border border-red-500/20 p-2.5 rounded-lg">
                <div className="text-xs font-bold text-white/40 w-8">J25</div>
                <div className="flex-1 flex items-center gap-2 text-white text-sm">
                  <span className="text-[10px] text-white/40 border border-white/20 px-1 rounded">
                    Away
                  </span>{' '}
                  Olympiacos
                </div>
                <div className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold uppercase">
                  Difícil
                </div>
              </div>
              <div className="flex items-center gap-3 bg-emerald-900/10 border border-emerald-500/20 p-2.5 rounded-lg">
                <div className="text-xs font-bold text-white/40 w-8">J26</div>
                <div className="flex-1 flex items-center gap-2 text-white text-sm">
                  <span className="text-[10px] text-white/40 border border-white/20 px-1 rounded">
                    Home
                  </span>{' '}
                  ALBA
                </div>
                <div className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase">
                  Fácil
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========================
// OPTION C: CARD EXPAND
// ========================
function ExpandView({ onClose }) {
  // Simulates the layout ID morphing. Here done simply with absolute positioning scaling.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#0b0c10]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-20"
      onClick={onClose}
    >
      <motion.div
        layoutId={'card-expansion-demo'}
        initial={{ scale: 0.5, borderRadius: 16 }}
        animate={{ scale: 1, borderRadius: 24 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-5xl h-full max-h-[800px] bg-[#111318] border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={onClose}
            className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-purple-400 font-bold tracking-widest uppercase mb-4 text-sm animate-pulse">
          Efecto Layout Animado
        </p>
        <h2 className="text-4xl text-white font-black mb-6 max-w-2xl leading-tight">
          La carta original vuela desde el grid y se convierte orgánicamente en este extenso lienzo.
        </h2>
        <p className="text-white/50 max-w-xl text-lg mb-8">
          Implica usar dependencias complejas de Framer Motion (layoutId compartidos), pero genera
          el efecto &apos;WOW&apos; más visual de las 3 opciones. Contendría los mismos grids de
          analítica que los anteriores.
        </p>

        <div className="flex gap-4 opacity-50">
          <div className="w-32 h-32 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="w-32 h-32 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="w-32 h-32 bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}
