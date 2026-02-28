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
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-border transition-colors group"
    >
      <div className="p-4 flex-1 flex flex-col">
        {/* Top Header: Price & Indicator */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold text-foreground">
              {new Intl.NumberFormat('es-ES').format(player.price)} €
            </span>
            <div
              className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${heuristic.color}`}
            >
              {heuristic.icon} {heuristic.label}
            </div>
          </div>
          {player.seller_icon && player.seller_name !== 'Mercado' ? (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full border border-border/30">
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
              <span className="text-xs font-medium px-2 py-1 bg-secondary/50 rounded text-muted-foreground border border-border/30">
                Biwenger
              </span>
            </div>
          )}
        </div>

        {/* Middle: Player Profile & Team */}
        <div className="flex items-center space-x-3 mb-4 mt-2">
          <div className="relative h-14 w-14 rounded-full overflow-hidden bg-secondary flex-shrink-0 border flex items-center justify-center border-border/50">
            {player.img ? (
              <Image
                src={player.img}
                alt={player.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground font-bold text-xl">
                ?
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate" title={player.name}>
              {player.name}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-0.5">
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
          <div className="bg-secondary/30 rounded-lg p-2 border border-border/30 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Puntos
            </span>
            <span className="text-lg font-display font-medium text-emerald-400">
              {player.total_points}
            </span>
          </div>
          <div className="bg-secondary/30 rounded-lg p-2 border border-border/30 flex flex-col items-center justify-center relative group">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center">
              Media <Info size={10} className="ml-1 opacity-50" />
            </span>
            <span className="text-lg font-display font-medium text-blue-400">
              {player.season_avg}
            </span>

            {/* Tooltip for recent form */}
            <div className="hidden group-hover:block absolute bottom-full mb-2 bg-popover text-popover-foreground text-xs p-2.5 rounded-lg border border-border shadow-xl min-w-max z-20">
              Últimos partidos: {player.recent_scores || 'N/A'}
              <br />
              Media reciente: {player.avg_recent_points?.toFixed(1) || '0.0'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onAnalyze(player)}
        className="w-full py-3 bg-secondary/60 hover:bg-secondary text-foreground text-sm font-semibold flex items-center justify-center transition-colors border-t border-border/50 cursor-pointer"
      >
        <ShieldAlert
          size={16}
          className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity"
        />
        Analizar Fichaje
      </button>
    </motion.div>
  );
}
