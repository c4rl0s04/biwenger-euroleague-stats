'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Frown } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function TheVictimCard({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1, 3);
  const restRunnerUps = data.slice(3);
  const winnerColor = getColorForUser(winner.id, winner.name, winner.color_index);

  return (
    <div className="hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="La Víctima" icon={Frown} color="pink">
        <div className="flex flex-col h-full">
          <div className="mt-2 text-center">
            <div className="text-xs text-pink-500 uppercase tracking-widest font-black mb-1">
              MÁS PUJAS PERDIDAS
            </div>

            <div className="flex justify-center mb-3">
              <Link href={`/user/${winner.id}`} className="group">
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-base font-black ${winnerColor.bg} ${winnerColor.text} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}
                >
                  {winner.name}
                </span>
              </Link>
            </div>

            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              {winner.failed_bids_count}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">fracasos</span>
            </div>

            <p className="text-[11px] text-zinc-500 font-semibold mt-1">
              Pujas donde otro manager terminó llevándose el fichaje
            </p>
          </div>

          {runnerUps.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex flex-col gap-2">
                {runnerUps.map((item, index) => {
                  const userColor = getColorForUser(item.id, item.name, item.color_index);
                  const isSecond = index === 0;
                  const rankStyles = isSecond
                    ? 'bg-gradient-to-r from-zinc-200/5 to-transparent border-l-2 border-zinc-500'
                    : 'bg-gradient-to-r from-pink-700/10 to-transparent border-l-2 border-pink-800';

                  return (
                    <div
                      key={item.id || index}
                      className={`flex items-center justify-between gap-3 p-2 rounded-r-lg hover:bg-zinc-800/40 transition-colors ${rankStyles}`}
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/user/${item.id}`}
                          className={`text-sm font-bold truncate ${userColor.text} hover:brightness-110 transition-colors block`}
                        >
                          {item.name}
                        </Link>
                        <span className="text-[11px] text-zinc-500">{index + 2}. puesto</span>
                      </div>
                      <span className="text-sm text-pink-400 font-black whitespace-nowrap">
                        {item.failed_bids_count} fallos
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
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-pink-400 transition-colors py-1 border-t border-zinc-800 cursor-pointer"
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
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {restRunnerUps.length > 0 && (
              <div className="pt-2 space-y-1">
                {restRunnerUps.map((item, index) => {
                  const userColor = getColorForUser(item.id, item.name, item.color_index);
                  return (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-zinc-500 font-bold w-4 flex-shrink-0">
                          {index + 4}.
                        </span>
                        <Link
                          href={`/user/${item.id}`}
                          className={`${userColor.text} truncate hover:brightness-110`}
                        >
                          {item.name}
                        </Link>
                      </div>
                      <span className="text-pink-400 font-semibold whitespace-nowrap ml-2">
                        {item.failed_bids_count}
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
