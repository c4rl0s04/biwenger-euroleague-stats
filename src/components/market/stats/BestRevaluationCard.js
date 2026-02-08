'use client';

import { useState } from 'react';
import { Telescope, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import Link from 'next/link';
import PlayerImage from '@/components/ui/PlayerImage';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

const formatEuro = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BestRevaluationCard({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1, 3);
  const restRunnerUps = data.slice(3);
  const winnerColor = getColorForUser(winner.user_id, winner.user_name, winner.user_color_index);

  const maxRevaluation = Math.max(...data.map((d) => d.revaluation));

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Visionario"
        icon={Telescope}
        color="purple"
        info="Mayor incremento de valor de un jugador desde su fichaje hasta hoy. (Valor Actual - Precio Compra)"
      >
        <div className="flex flex-col">
          {/* Hero Section */}
          <div className="relative mt-2">
            {/* Player Image */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-purple-500/50 shadow-lg shadow-purple-500/20">
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
            </div>

            {/* Player Name */}
            <div className="text-center">
              <Link href={`/player/${winner.player_id}`} className="group">
                <span className="text-lg font-black text-white group-hover:text-purple-400 transition-colors">
                  {winner.player_name}
                </span>
              </Link>
            </div>

            {/* Revaluation Display */}
            <div className="mt-3 text-center">
              <span className="text-2xl font-black text-purple-400">
                +{formatEuro(winner.revaluation)}€
              </span>
              <div className="flex justify-center gap-4 text-xs mt-1">
                <div className="flex flex-col items-center">
                  <span className="text-zinc-500 font-medium">Compra</span>
                  <span className="text-zinc-300">{formatEuro(winner.purchase_price)}€</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-zinc-500 font-medium">Valor</span>
                  <span className="text-zinc-300">{formatEuro(winner.current_price)}€</span>
                </div>
              </div>
            </div>

            {/* Owner Badge */}
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

          {/* Mini Podium */}
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
                    : 'bg-gradient-to-r from-amber-700/10 to-transparent border-l-2 border-amber-800';
                  const ringColor = isSecond ? 'ring-zinc-500' : 'ring-amber-800';

                  return (
                    <div
                      key={item.player_id + '-' + index}
                      className={`flex items-center gap-3 p-2 rounded-r-lg hover:bg-zinc-800/40 transition-colors ${rankStyles}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${ringColor} shadow-md`}
                        >
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/player/${item.player_id}`}
                          className="text-xs font-medium text-zinc-200 truncate hover:text-purple-400 transition-colors block"
                        >
                          {item.player_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-purple-400 font-bold">
                            +{formatEuro(item.revaluation)}€
                          </span>
                          <Link
                            href={`/user/${item.user_id}`}
                            className={`text-[11px] truncate ${userColor.text} opacity-75 hover:opacity-100 block`}
                          >
                            {item.user_name}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expand/Collapse */}
          {restRunnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-purple-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" /> Ocultar resto
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" /> Ver 4º-10º
                </>
              )}
            </button>
          )}

          {/* Rest of Runner-ups */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {restRunnerUps.length > 0 && (
              <div className="pt-2 space-y-1">
                {restRunnerUps.map((item, index) => {
                  const userColor = getColorForUser(
                    item.user_id,
                    item.user_name,
                    item.user_color_index
                  );
                  return (
                    <div
                      key={item.player_id + '-' + index}
                      className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-zinc-500 font-bold w-4 flex-shrink-0">
                          {index + 4}.
                        </span>
                        <Link
                          href={`/player/${item.player_id}`}
                          className="text-zinc-300 truncate hover:text-purple-400 transition-colors"
                        >
                          {item.player_name}
                        </Link>
                        <Link
                          href={`/user/${item.user_id}`}
                          className={`${userColor.text} truncate text-[10px] hover:brightness-110 ml-2`}
                        >
                          {item.user_name}
                        </Link>
                      </div>
                      <span className="text-purple-400 font-semibold whitespace-nowrap ml-2">
                        +{formatEuro(item.revaluation)}€
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
