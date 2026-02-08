'use client';

import { useState } from 'react';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function RecordTransferCard({ record }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!record || !Array.isArray(record) || record.length === 0) return null;

  const winner = record[0];
  const runnerUps = record.slice(1);
  const winnerColor = getColorForUser(winner.buyer_id, winner.buyer_name, winner.buyer_color);

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val?.toLocaleString('es-ES');
  };

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="Récord Histórico" icon={TrendingUp} color="rose">
        <div className="flex flex-col">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-rose-500 uppercase tracking-widest font-black mb-1">
              TRASPASO MÁS CARO
            </div>

            <Link href={`/player/${winner.player_id}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-rose-500 group-hover:text-rose-400 transition-colors truncate px-2 leading-tight">
                {winner.player_name || 'Desconocido'}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {formatEuro(winner.precio)} €
            </div>
            <p className="text-[10px] text-zinc-500 font-bold">
              Comprador:{' '}
              <span className={winnerColor.text}>{winner.buyer_name || winner.comprador}</span>
            </p>
          </div>

          {/* Expand/Collapse Button */}
          {runnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-rose-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
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
                    const buyerColor = getColorForUser(
                      item.buyer_id,
                      item.buyer_name,
                      item.buyer_color
                    );
                    return (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-zinc-500 font-bold w-4 flex-shrink-0">
                            {index + 2}.
                          </span>
                          <Link
                            href={`/player/${item.player_id}`}
                            className="text-zinc-300 hover:text-rose-400 truncate"
                          >
                            {item.player_name}
                          </Link>
                          <span className="text-zinc-600 flex-shrink-0">→</span>
                          <span className={`${buyerColor.text} truncate text-[10px]`}>
                            {item.buyer_name || item.comprador}
                          </span>
                        </div>
                        <span className="text-zinc-400 font-semibold whitespace-nowrap ml-2">
                          {formatEuro(item.precio)}€
                        </span>
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
