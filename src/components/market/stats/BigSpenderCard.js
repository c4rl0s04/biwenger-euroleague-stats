'use client';

import { useState } from 'react';
import { Gem, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function BigSpenderCard({ spender }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!spender || !Array.isArray(spender) || spender.length === 0) return null;

  const winner = spender[0];
  const runnerUps = spender.slice(1);
  const winnerColor = getColorForUser(winner.id, winner.name, winner.color_index);

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString('es-ES');
  };

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="El Jeque" icon={Gem} color="cyan">
        <div className="flex flex-col">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-cyan-500 uppercase tracking-widest font-black mb-1">
              MAYOR INVERSOR
            </div>

            <Link href={`/user/${winner.id || ''}`} className="block group">
              <div
                className={`text-xl md:text-2xl font-black ${winnerColor.text} group-hover:brightness-110 transition-colors truncate px-2 leading-tight`}
              >
                {winner.name || 'Desconocido'}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {formatEuro(winner.total_spent)} €
            </div>
            <p className="text-[10px] text-zinc-500 font-bold">
              {winner.purchases_count} operaciones
            </p>
          </div>

          {/* Expand/Collapse Button */}
          {runnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
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
                    const userColor = getColorForUser(item.id, item.name, item.color_index);
                    return (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 font-bold w-4">{index + 2}.</span>
                          <Link
                            href={`/user/${item.id}`}
                            className={`${userColor.text} hover:brightness-110 truncate`}
                          >
                            {item.name}
                          </Link>
                        </div>
                        <span className="text-zinc-400 font-semibold">
                          {formatEuro(item.total_spent)}€
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
