'use client';

import { useState } from 'react';
import { ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import PlayerImage from '@/components/ui/PlayerImage';
import { getColorForUser } from '@/lib/constants/colors';

export default function WorstValueCard({ player }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!player || !Array.isArray(player) || player.length === 0) return null;

  const winner = player[0];
  const runnerUps = player.slice(1, 3);
  const restRunnerUps = player.slice(3);
  const winnerColor = getColorForUser(winner.user_id, winner.user_name, winner.user_color_index);

  const formatNumber = (val) => {
    return val?.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  };

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Flop"
        icon={ThumbsDown}
        color="red"
        info="Peor Rentabilidad. Puntos por millón más bajos entre jugadores caros (>2M). La gran decepción."
      >
        <div className="flex flex-col h-full">
          <div className="mt-2 text-center">
            <div className="text-xs text-red-500 uppercase tracking-widest font-black mb-1">
              LA DECEPCIÓN
            </div>

            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-red-500/50 shadow-lg shadow-red-500/20">
                <PlayerImage
                  src={winner.player_img}
                  alt={winner.player_name}
                  width={80}
                  height={80}
                  className="object-cover object-top w-full h-full"
                  fallbackSize={40}
                />
              </div>
            </div>

            <Link href={`/player/${winner.player_id}`} className="group">
              <div className="text-lg md:text-xl font-black text-white group-hover:text-red-400 transition-colors truncate px-2 leading-tight">
                {winner.player_name}
              </div>
            </Link>

            <div className="text-2xl font-black text-red-400 mt-3">
              {formatNumber(winner.points_per_million)}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">pts/M€</span>
            </div>

            <div className="flex justify-center gap-4 text-xs mt-1">
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 font-medium">Puntos</span>
                <span className="text-zinc-300">{winner.total_points}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 font-medium">Compra</span>
                <span className="text-zinc-300">{formatEuro(winner.purchase_price)}€</span>
              </div>
            </div>

            <div className="flex justify-center mt-3">
              <Link href={`/user/${winner.user_id}`} className="group">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${winnerColor.bg} ${winnerColor.text} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}
                >
                  {winner.user_name}
                </span>
              </Link>
            </div>
          </div>

          {runnerUps.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex flex-col gap-2">
                {runnerUps.map((item, index) => {
                  const userColor = getColorForUser(
                    item.user_id,
                    item.user_name,
                    item.user_color_index
                  );
                  const isSecond = index === 0;
                  const rankStyles = isSecond
                    ? 'bg-gradient-to-r from-zinc-200/5 to-transparent border-l-2 border-zinc-500'
                    : 'bg-gradient-to-r from-red-700/10 to-transparent border-l-2 border-red-800';
                  const ringColor = isSecond ? 'ring-zinc-500' : 'ring-red-800';

                  return (
                    <div
                      key={item.player_id + '-' + index}
                      className={`flex items-center gap-3 p-2 rounded-r-lg hover:bg-zinc-800/40 transition-colors ${rankStyles}`}
                    >
                      <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${ringColor}`}>
                        <Link href={`/player/${item.player_id}`} className="block w-full h-full">
                          <PlayerImage
                            src={item.player_img}
                            alt={item.player_name}
                            width={36}
                            height={36}
                            className="object-cover object-top w-full h-full"
                            fallbackSize={18}
                          />
                        </Link>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/player/${item.player_id}`}
                          className="text-xs font-medium text-zinc-200 truncate hover:text-red-400 transition-colors block"
                        >
                          {item.player_name}
                        </Link>
                        <Link
                          href={`/user/${item.user_id}`}
                          className={`text-[11px] truncate ${userColor.text} opacity-75 hover:opacity-100 block`}
                        >
                          {item.user_name}
                        </Link>
                      </div>
                      <span className="text-xs text-red-400 font-bold whitespace-nowrap">
                        {formatNumber(item.points_per_million)} pts/M
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {restRunnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-red-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
            >
              {isExpanded ? 'Ocultar resto' : 'Ver 4º-10º'}
            </button>
          )}

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {restRunnerUps.length > 0 && (
              <div className="pt-2 space-y-1">
                {restRunnerUps.map((item, index) => (
                  <div
                    key={item.player_id + '-' + index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-zinc-500 font-bold w-4 shrink-0">{index + 4}.</span>
                      <span className="text-zinc-300 truncate">{item.player_name}</span>
                    </div>
                    <span className="text-red-400 font-semibold whitespace-nowrap ml-2">
                      {formatNumber(item.points_per_million)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
