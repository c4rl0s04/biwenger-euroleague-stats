'use client';

import { useState } from 'react';
import { Egg, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function ProfitablePlayerCard({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1);

  const formatEuro = (val) => {
    const abs = Math.abs(val);
    if (abs >= 1000000) return (abs / 1000000).toFixed(1) + 'M';
    if (abs >= 1000) return (abs / 1000).toFixed(0) + 'k';
    return abs.toLocaleString('es-ES');
  };

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="La Gallina"
        icon={Egg}
        color="yellow"
        info="El jugador que más beneficio total ha generado para todos los usuarios que lo han comprado y vendido."
      >
        <div className="flex flex-col">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-yellow-500 uppercase tracking-widest font-black mb-1">
              MÁQUINA DE DINERO
            </div>

            <Link href={`/player/${winner.player_id}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-yellow-500 group-hover:text-yellow-400 transition-colors truncate px-2 leading-tight">
                {winner.player_name}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
              +{formatEuro(winner.total_profit)}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">€ generados</span>
            </div>

            <p className="text-[10px] text-zinc-500 font-bold">
              {winner.trade_count} operaciones rentables
            </p>
          </div>

          {/* Expand/Collapse Button */}
          {runnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-yellow-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Ocultar top 10
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver top 10
                </>
              )}
            </button>
          )}

          {/* Runner-ups List - Collapsible with Animation */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {runnerUps.length > 0 && (
              <div className="pt-2">
                <div className="space-y-1">
                  {runnerUps.map((item, index) => (
                    <div
                      key={item.player_id}
                      className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-zinc-500 font-bold w-4 flex-shrink-0">
                          {index + 2}.
                        </span>
                        <Link
                          href={`/player/${item.player_id}`}
                          className="text-zinc-300 hover:text-yellow-400 truncate"
                        >
                          {item.player_name}
                        </Link>
                      </div>
                      <span className="text-emerald-400 font-semibold whitespace-nowrap ml-2">
                        +{formatEuro(item.total_profit)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
