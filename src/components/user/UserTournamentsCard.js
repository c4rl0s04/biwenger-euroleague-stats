'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Flag,
  Info,
  CheckCircle2,
  Activity,
  History,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserTournamentsCard({ tournaments }) {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="col-span-full">
        <ElegantCard title="Competiciones" icon={Trophy} color="orange">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-white/40 italic">
              El mánager no ha participado en ningún torneo todavía.
            </p>
          </div>
        </ElegantCard>
      </div>
    );
  }

  const leagues = tournaments.filter(
    (t) => t.tournament_type === 'league' || t.tournament_type === 'porra'
  );
  const playoffs = tournaments.filter((t) => t.tournament_type === 'playoff');

  const renderTournamentCard = (t, idx, isPlayoff = false) => {
    const isPorra =
      t.tournament_type === 'porra' || t.tournament_name.toLowerCase().includes('porra');
    const color = isPorra ? 'orange' : isPlayoff ? 'pink' : 'indigo';
    const Icon = isPorra ? Flag : isPlayoff ? Trophy : Medal;

    const totalMatches = (t.won || 0) + (t.drawn || 0) + (t.lost || 0);

    return (
      <div key={`${t.tournament_id}-${idx}`} className="group relative h-full w-full">
        {/* Subtle background gradient inject */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${isPorra ? 'from-orange-500/5' : isPlayoff ? 'from-pink-500/5' : 'from-indigo-500/5'} to-transparent rounded-2xl z-0 pointer-events-none opacity-50 transition-opacity duration-500 group-hover:opacity-100`}
        />

        <ElegantCard
          title={
            <Link
              href={`/tournaments/${t.tournament_id}`}
              onClick={(e) => e.stopPropagation()}
              className={`flex items-center gap-1.5 text-white hover:text-${color}-400 transition-colors duration-300 group/link`}
              title="Ver detalles del torneo"
            >
              {t.tournament_name}
              <ExternalLink
                className={`w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all text-${color}-400`}
              />
            </Link>
          }
          icon={Icon}
          color={color}
          className="h-full border-white/5 group-hover:border-white/10 transition-colors duration-500"
        >
          <div className="flex flex-col h-full justify-between gap-6 relative z-10">
            {/* --- HEADER ZONE --- */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                      t.tournament_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'bg-slate-500/10 text-slate-300 border-slate-500/30 shadow-[0_0_10px_rgba(100,116,139,0.1)] group-hover:shadow-[0_0_15px_rgba(100,116,139,0.15)] group-hover:border-slate-500/50'
                    }`}
                  >
                    {t.tournament_status === 'active' ? (
                      <>
                        <Activity className="w-3.5 h-3.5" /> En curso
                      </>
                    ) : (
                      <>
                        <History className="w-3 h-3 opacity-80" /> Finalizado
                      </>
                    )}
                  </div>
                </div>

                {!isPlayoff && t.phase_name && (
                  <div className="text-xs font-medium text-white/50 bg-black/20 rounded-md px-2.5 py-1.5 border border-white/5 inline-block w-fit">
                    Fase: <span className="text-white/80 font-bold">{t.phase_name}</span>
                    {t.group_name && ` • Grupo: ${t.group_name}`}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end text-right shrink-0">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                  {isPlayoff ? 'Fase Alcanzada' : 'Posición'}
                </div>
                <div
                  className={`font-display font-black tracking-tight transition-transform duration-300 group-hover:scale-105 origin-right ${isPlayoff || t.position === 1 ? 'text-2xl sm:text-3xl' : 'text-5xl'}`}
                >
                  {isPlayoff ? (
                    t.phase_name === 'Campeón' ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                        Campeón
                      </span>
                    ) : (
                      <span className="text-white drop-shadow-md">
                        {t.phase_name || 'Desconocida'}
                      </span>
                    )
                  ) : t.position ? (
                    t.position === 1 ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                        {t.tournament_status === 'active' ? 'Líder' : 'Campeón'}
                      </span>
                    ) : (
                      <div className="flex items-baseline drop-shadow-md">
                        <span className="text-2xl text-white/30 mr-1 font-medium">#</span>
                        <span className="text-white">{t.position}</span>
                      </div>
                    )
                  ) : (
                    <span className="text-white/30">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* --- STATS ZONE --- */}
            {totalMatches > 0 ? (
              <div className="grid grid-cols-3 gap-1 bg-black/30 rounded-xl p-1.5 border border-white/5 backdrop-blur-sm group-hover:bg-black/40 transition-colors duration-300">
                <div className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-emerald-500/10 transition-colors duration-300 cursor-default">
                  <div className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-1">
                    V
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-emerald-400">
                    {t.won || 0}
                  </div>
                </div>
                <div className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-white/5 transition-colors duration-300 cursor-default">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                    E
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white/70">
                    {t.drawn || 0}
                  </div>
                </div>
                <div className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-destructive/10 transition-colors duration-300 cursor-default">
                  <div className="text-[10px] font-black text-destructive/70 uppercase tracking-widest mb-1">
                    D
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-destructive">
                    {t.lost || 0}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 bg-black/30 rounded-xl border border-white/5 backdrop-blur-sm group-hover:bg-black/40 transition-colors duration-300">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                  Puntos Totales
                </div>
                <div className="text-3xl font-display font-black text-white/90">
                  {t.points || 0}
                </div>
              </div>
            )}
          </div>
        </ElegantCard>
      </div>
    );
  };
  const renderLeagues = () => {
    if (leagues.length === 0) return null;
    return (
      <TournamentGroup
        key="leagues"
        title="Liga"
        colorClass="bg-indigo-500"
        tournaments={leagues}
        isPlayoff={false}
        renderCard={renderTournamentCard}
      />
    );
  };

  const renderPlayoffs = () => {
    if (playoffs.length === 0) return null;
    return (
      <TournamentGroup
        key="playoffs"
        title="Eliminatoria"
        colorClass="bg-pink-500"
        tournaments={playoffs}
        isPlayoff={true}
        renderCard={renderTournamentCard}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-14 col-span-full items-start">
      {renderLeagues()}
      {renderPlayoffs()}
    </div>
  );
}

function TournamentGroup({ title, colorClass, tournaments, isPlayoff, renderCard }) {
  // Option 3 Horizontal: Flex Bento Accordion
  // By default, no tournament is expanded (all look like vertical columns)
  const [expandedId, setExpandedId] = useState(null);

  if (tournaments.length <= 1) {
    return (
      <div>
        <h3 className="text-xl md:text-2xl font-black text-white/90 uppercase tracking-widest mb-6 flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${colorClass}`} />
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t, idx) => renderCard(t, idx, isPlayoff))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-black text-white/90 uppercase tracking-widest flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${colorClass}`} />
          {title}
          <span className="text-sm font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full ml-2">
            {tournaments.length}
          </span>
        </h3>
      </div>
      {/* Accordion container - Vertical on Mobile, Horizontal on Desktop */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-full overflow-x-auto overflow-y-hidden pb-4 md:pb-2 hide-scrollbar md:min-h-[280px] items-stretch">
        {tournaments.map((t, idx) => {
          const isExpanded = expandedId === t.tournament_id;
          const isPorra =
            t.tournament_type === 'porra' || t.tournament_name.toLowerCase().includes('porra');
          const colorName = isPorra ? 'orange' : isPlayoff ? 'pink' : 'indigo';
          const Icon = isPorra ? Flag : isPlayoff ? Trophy : Medal;

          return (
            <motion.div
              layout
              key={t.tournament_id}
              onClick={() => setExpandedId(isExpanded ? null : t.tournament_id)}
              className={`cursor-pointer overflow-hidden rounded-2xl relative group border shrink-0 transition-all duration-300 flex ${
                isExpanded
                  ? `w-full md:w-[360px] opacity-100 border-white/5 bg-black/20 shadow-2xl`
                  : `w-full md:w-[80px] h-[80px] md:h-auto opacity-80 hover:opacity-100 border-${colorName}-500/20 bg-${colorName}-500/5 hover:bg-${colorName}-500/10`
              }`}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <div
                className={`w-full relative pointer-events-${isExpanded ? 'auto' : 'none'} flex flex-col md:flex-row`}
              >
                <AnimatePresence mode="popLayout">
                  {isExpanded ? (
                    <motion.div
                      key="full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full md:min-w-[360px]"
                    >
                      {renderCard(t, idx, isPlayoff)}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="compact"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-[80px] md:h-full md:w-full flex md:flex-col items-center justify-center p-4 gap-3 transition-colors absolute inset-0"
                    >
                      <Icon
                        className={`w-6 h-6 md:w-8 md:h-8 shrink-0 text-${colorName}-400/80 group-hover:text-${colorName}-400 group-hover:scale-110 transition-transform`}
                      />
                      {/* Desktop vertical text */}
                      <div
                        className={`hidden md:flex [writing-mode:vertical-rl] rotate-180 text-${colorName}-100/70 group-hover:text-${colorName}-100 font-black tracking-[0.2em] uppercase text-sm items-center h-full min-h-0 overflow-hidden whitespace-nowrap`}
                      >
                        {t.tournament_name}
                      </div>
                      {/* Mobile horizontal text */}
                      <div
                        className={`md:hidden text-${colorName}-100/70 group-hover:text-${colorName}-100 font-black tracking-widest uppercase text-xs truncate`}
                      >
                        {t.tournament_name}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
