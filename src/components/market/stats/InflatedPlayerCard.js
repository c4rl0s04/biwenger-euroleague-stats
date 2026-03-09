'use client';

import { useState } from 'react';
import { BadgePercent, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import PlayerImage from '@/components/ui/PlayerImage';

function formatEuro(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return (abs / 1000).toFixed(0) + 'k';
  return abs.toLocaleString('es-ES');
}

export default function InflatedPlayerCard({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1, 3);
  const restRunnerUps = data.slice(3);

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Inflado"
        icon={BadgePercent}
        color="rose"
        info="El jugador que más veces se ha comprado por encima de su valor de mercado del día y mayor sobreprecio acumulado arrastra."
      >
        <div className="flex flex-col h-full">
          <div className="mt-2 text-center">
            <div className="text-xs text-rose-500 uppercase tracking-widest font-black mb-1">
              MÁS SOBREVALORADO
            </div>

            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-rose-500/50 shadow-lg shadow-rose-500/20">
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

            <Link href={`/player/${winner.player_id}`} className="block group">
              <div className="text-lg md:text-xl font-black text-white group-hover:text-rose-400 transition-colors truncate px-2 leading-tight">
                {winner.player_name}
              </div>
            </Link>

            <div className="text-2xl font-black text-rose-400 mt-3">
              +{formatEuro(winner.total_inflation)}€
            </div>

            <div className="flex justify-center gap-4 text-xs mt-2">
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 font-medium">Compras</span>
                <span className="text-zinc-300">{winner.trade_count}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 font-medium">Media</span>
                <span className="text-zinc-300">+{formatEuro(winner.avg_inflation)}€</span>
              </div>
            </div>
          </div>

          {runnerUps.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex flex-col gap-2">
                {runnerUps.map((item, index) => {
                  const isSecond = index === 0;
                  const rankStyles = isSecond
                    ? 'bg-gradient-to-r from-zinc-200/5 to-transparent border-l-2 border-zinc-500'
                    : 'bg-gradient-to-r from-rose-700/10 to-transparent border-l-2 border-rose-800';
                  const ringColor = isSecond ? 'ring-zinc-500' : 'ring-rose-800';

                  return (
                    <div
                      key={item.player_id || index}
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
                          className="text-xs font-medium text-zinc-200 truncate hover:text-rose-400 transition-colors block"
                        >
                          {item.player_name}
                        </Link>
                        <div className="text-[11px] text-zinc-500">
                          {item.trade_count} compras por encima de mercado
                        </div>
                      </div>
                      <span className="text-xs text-rose-400 font-bold whitespace-nowrap">
                        +{formatEuro(item.total_inflation)}€
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
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-rose-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Ocultar resto
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver 4º-10º
                </>
              )}
            </button>
          )}

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {restRunnerUps.length > 0 && (
              <div className="pt-2 space-y-1">
                {restRunnerUps.map((item, index) => (
                  <div
                    key={item.player_id || index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-zinc-500 font-bold w-4 shrink-0">{index + 4}.</span>
                      <Link
                        href={`/player/${item.player_id}`}
                        className="text-zinc-300 hover:text-rose-400 truncate"
                      >
                        {item.player_name}
                      </Link>
                    </div>
                    <span className="text-rose-400 font-semibold whitespace-nowrap ml-2">
                      +{formatEuro(item.total_inflation)}€
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
