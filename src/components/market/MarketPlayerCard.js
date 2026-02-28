import React from 'react';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Info, ShieldAlert, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Heuristic logic to determine badge
function getPurchaseHeuristic(player) {
  const { value_score, price_trend } = player;

  if (value_score > 30 && price_trend > 0) {
    return {
      label: 'Compra Excelente',
      color: 'bg-green-500/20 text-green-400',
      icon: <TrendingUp size={14} className="mr-1" />,
    };
  } else if (value_score < 10 || price_trend < 0) {
    return {
      label: 'Compra Arriesgada',
      color: 'bg-red-500/20 text-red-400',
      icon: <TrendingDown size={14} className="mr-1" />,
    };
  } else {
    return {
      label: 'Compra Normal',
      color: 'bg-yellow-500/20 text-yellow-400',
      icon: <Star size={14} className="mr-1" />,
    };
  }
}

export default function MarketPlayerCard({ player, onAnalyze }) {
  const heuristic = getPurchaseHeuristic(player);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-md flex flex-col hover:border-zinc-700 transition"
    >
      <div className="p-4 flex-1 flex flex-col">
        {/* Top Header: Price & Indicator */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <span className="text-xl font-black text-white">
              {new Intl.NumberFormat('es-ES').format(player.price)} €
            </span>
            <div
              className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${heuristic.color}`}
            >
              {heuristic.icon} {heuristic.label}
            </div>
          </div>
          {player.seller_icon && player.seller_name !== 'Mercado' ? (
            <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded-full">
              <span className="capitalize">{player.seller_name}</span>
              {player.seller_icon ? (
                <Image
                  src={player.seller_icon}
                  alt={player.seller_name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium px-2 py-1 bg-zinc-800 rounded text-zinc-300">
                Biwenger
              </span>
            </div>
          )}
        </div>

        {/* Middle: Player Profile & Team */}
        <div className="flex items-center space-x-3 mb-4 mt-2">
          <div className="relative h-14 w-14 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
            {player.img ? (
              <Image
                src={player.img}
                alt={player.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 font-bold text-xl">
                ?
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-zinc-100 truncate" title={player.name}>
              {player.name}
            </h3>
            <div className="flex items-center text-xs text-zinc-400 space-x-2 mt-0.5">
              <span>{player.position}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                {player.team_img ? (
                  <Image src={player.team_img} alt={player.team} width={14} height={14} />
                ) : null}
                <span className="truncate">{player.team}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats: Points */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="bg-black/20 rounded p-2 flex flex-col items-center justify-center">
            <span className="text-xs text-zinc-500 uppercase font-bold">Puntos Totales</span>
            <span className="text-lg font-bold text-blue-400">{player.total_points}</span>
          </div>
          <div className="bg-black/20 rounded p-2 flex flex-col items-center justify-center relative group">
            <span className="text-xs text-zinc-500 uppercase font-bold flex items-center">
              Media <Info size={10} className="ml-1 opacity-50" />
            </span>
            <span className="text-lg font-bold text-emerald-400">{player.season_avg}</span>

            {/* Tooltip for recent form */}
            <div className="hidden group-hover:block absolute bottom-full mb-2 bg-zinc-800 text-white text-xs p-2 rounded shadow-xl min-w-max z-20">
              Últimos partidos: {player.recent_scores || 'N/A'}
              <br />
              Media reciente: {player.avg_recent_points.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onAnalyze(player)}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold flex items-center justify-center transition"
      >
        <ShieldAlert size={16} className="mr-2" />
        Analizar Fichaje
      </button>
    </motion.div>
  );
}
