'use client';

import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function UserTrophyCabinetCard({ tournaments }) {
  // Extract Trophies only from finished tournaments
  const trophies = [];

  if (tournaments && tournaments.length > 0) {
    tournaments.forEach((t) => {
      if (t.tournament_status !== 'active') {
        const isPlayoffChampion = t.tournament_type === 'playoff' && t.phase_name === 'Campeón';
        const isLeagueChampion =
          (t.tournament_type === 'league' || t.tournament_type === 'porra') && t.position === 1;

        let type, icon, posLabel;

        if (isPlayoffChampion || isLeagueChampion) {
          type = 'gold';
          icon = Trophy;
          posLabel = '1º';
        } else if (
          t.position === 2 ||
          (t.tournament_type === 'playoff' && t.phase_name === 'Final')
        ) {
          type = 'silver';
          icon = Trophy;
          posLabel = '2º';
        } else if (
          t.position === 3 ||
          (t.tournament_type === 'playoff' && t.phase_name === 'Semifinal')
        ) {
          type = 'bronze';
          icon = Trophy;
          posLabel = '3º';
        } else {
          type = 'participant';
          icon = Medal;
          posLabel = t.position ? `${t.position}º` : 'TOP';
        }

        trophies.push({
          id: `tourn-${t.tournament_id}`,
          tournamentId: t.tournament_id,
          title: t.tournament_name,
          position: posLabel,
          type,
          icon,
          date: t.created_at ? new Date(t.created_at).getFullYear() : 'Temporada',
        });
      }
    });
  }

  if (trophies.length === 0) {
    return (
      <div className="col-span-full">
        <ElegantCard title="Vitrina de Trofeos" icon={Crown} color="yellow">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="w-16 h-16 text-white/10 mb-4" />
            <p className="text-white/40 italic">
              Aún no hay trofeos en la vitrina. ¡La gloria aguarda!
            </p>
          </div>
        </ElegantCard>
      </div>
    );
  }

  const TrophyItem = ({ trophy, index }) => {
    const isGold = trophy.type === 'gold';
    const isSilver = trophy.type === 'silver';
    const isBronze = trophy.type === 'bronze';

    // Scale the trophies based on their tier
    const heightClass = isGold
      ? 'h-32 w-24'
      : isSilver
        ? 'h-24 w-20'
        : isBronze
          ? 'h-20 w-16'
          : 'h-16 w-12';
    const iconSize = isGold ? 72 : isSilver ? 56 : isBronze ? 48 : 36;

    const colorClasses = {
      gold: 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]',
      silver: 'text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.5)]',
      bronze: 'text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]',
      participant: 'text-zinc-400 drop-shadow-[0_0_10px_rgba(161,161,170,0.3)]',
    };

    const baseGradients = {
      gold: 'from-yellow-900 to-yellow-950 border-yellow-600/50',
      silver: 'from-slate-700 to-slate-900 border-slate-500/50',
      bronze: 'from-orange-900 to-orange-950 border-orange-700/50',
      participant: 'from-zinc-800 to-zinc-950 border-zinc-600/50',
    };

    const plateGradients = {
      gold: 'from-yellow-200 via-yellow-400 to-yellow-600 text-yellow-950',
      silver: 'from-slate-200 via-slate-300 to-slate-500 text-slate-900',
      bronze: 'from-orange-300 via-orange-500 to-orange-700 text-orange-950',
      participant: 'from-zinc-300 via-zinc-400 to-zinc-600 text-zinc-900',
    };

    const Icon = trophy.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        className="relative snap-center z-10 mx-2"
      >
        <Link
          href={`/tournaments/${trophy.tournamentId}`}
          className="relative flex flex-col items-center justify-end group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 rounded-lg"
        >
          {/* The Cup/Trophy */}
          <div
            className={`relative flex items-end justify-center mb-1 transition-transform duration-500 group-hover:-translate-y-6 ${heightClass}`}
          >
            <Icon size={iconSize} strokeWidth={1} className={colorClasses[trophy.type]} />
            {/* Ambient Glow behind trophy */}
            <div
              className={`absolute inset-0 bg-current opacity-20 blur-2xl rounded-full ${colorClasses[trophy.type].split(' ')[0]}`}
            />
          </div>

          {/* The Pedestal */}
          <div
            className={`w-20 h-10 rounded-t-lg border-t shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center bg-gradient-to-b ${baseGradients[trophy.type]} transition-transform duration-500 group-hover:-translate-y-3`}
          >
            {/* The Engraved Plate */}
            <div
              className={`w-14 h-5 mt-1 rounded-[2px] flex items-center justify-center bg-gradient-to-b shadow-inner ${plateGradients[trophy.type]}`}
            >
              <span className="text-[11px] font-black tracking-tighter drop-shadow-sm">
                {trophy.position}
              </span>
            </div>
          </div>

          {/* Static Label (below the shelf) */}
          <div className="absolute top-full mt-6 flex flex-col items-center pointer-events-none w-40 z-20 transition-transform duration-500 group-hover:scale-105 group-focus-visible:scale-105">
            <div className="text-sm font-black text-white/80 text-center leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-white group-focus-visible:text-white">
              {trophy.title}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">
              {trophy.date}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="col-span-full">
      <ElegantCard color="yellow" className="overflow-hidden" padding="p-0" hideHeader={true}>
        <div className="relative w-full h-full overflow-hidden group/cabinet bg-gradient-to-b from-stone-900/60 to-black/90">
          {/* Custom Header matching ElegantCard style */}
          <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <h3 className="text-lg sm:text-xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 uppercase tracking-widest flex items-center gap-2 group-hover/card:text-white transition-colors">
                Vitrina de Trofeos
              </h3>
            </div>
          </div>

          {/* Studio Lighting Effects */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

          {/* The Physical Shelf Container */}
          <div className="relative pt-24 pb-24 px-8 flex overflow-x-auto overflow-y-hidden hide-scrollbar gap-4 sm:gap-8 snap-x items-end min-h-[360px] z-10">
            {trophies.map((trophy, idx) => (
              <TrophyItem key={trophy.id} trophy={trophy} index={idx} />
            ))}
          </div>

          {/* The Glass/Wood Shelf Edge (spans the entire width of the container) */}
          <div className="absolute bottom-24 left-0 right-0 h-4 bg-gradient-to-b from-white/20 to-white/5 border-t border-white/40 shadow-[0_30px_60px_rgba(0,0,0,0.9)] backdrop-blur-md pointer-events-none z-0" />
          <div className="absolute bottom-[92px] left-0 right-0 h-[1px] bg-white/20 pointer-events-none z-0" />
        </div>
      </ElegantCard>
    </div>
  );
}
