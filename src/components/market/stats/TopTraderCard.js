'use client';

import { useState } from 'react';
import { Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function TopTraderCard({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1);
  const winnerColor = getColorForUser(winner.user_id, winner.user_name, winner.user_color_index);

  const formatEuro = (val) => {
    const abs = Math.abs(val);
    if (abs >= 1000000) return (abs / 1000000).toFixed(1) + 'M';
    if (abs >= 1000) return (abs / 1000).toFixed(0) + 'k';
    return abs.toLocaleString('es-ES');
  };

  const formatProfit = (val) => {
    const prefix = val >= 0 ? '+' : '-';
    return `${prefix}${formatEuro(val)}`;
  };

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Especulador"
        icon={Repeat}
        color="indigo"
        info="El usuario con más operaciones completas de compraventa (ciclos compra→venta)."
      >
        <div className="flex flex-col">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-indigo-500 uppercase tracking-widest font-black mb-1">
              MÁS OPERACIONES
            </div>

            <Link href={`/user/${winner.user_id}`} className="block group">
              <div
                className={`text-xl md:text-2xl font-black ${winnerColor.text} group-hover:brightness-110 transition-colors truncate px-2 leading-tight`}
              >
                {winner.user_name}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {winner.trade_count}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">operaciones</span>
            </div>

            <p className="text-[10px] text-zinc-500 font-bold">
              Balance:{' '}
              <span className={winner.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {formatProfit(winner.total_profit)}€
              </span>
            </p>
          </div>

          {/* Expand/Collapse Button */}
          {runnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-indigo-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
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
                  {runnerUps.map((item, index) => {
                    const userColor = getColorForUser(
                      item.user_id,
                      item.user_name,
                      item.user_color_index
                    );
                    return (
                      <div
                        key={item.user_id || index}
                        className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-zinc-500 font-bold w-4 flex-shrink-0">
                            {index + 2}.
                          </span>
                          <Link
                            href={`/user/${item.user_id}`}
                            className={`${userColor.text} hover:brightness-110 truncate`}
                          >
                            {item.user_name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-zinc-400 font-semibold">{item.trade_count}</span>
                          <span
                            className={`text-[10px] ${item.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                          >
                            ({formatProfit(item.total_profit)}€)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
