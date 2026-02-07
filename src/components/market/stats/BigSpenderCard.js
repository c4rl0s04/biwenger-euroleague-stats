'use client';

import { Gem, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function BigSpenderCard({ spender }) {
  if (!spender || !Array.isArray(spender) || spender.length === 0) return null;

  const winner = spender[0];
  const runnerUps = spender.slice(1);

  const formatEuro = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toLocaleString('es-ES');
  };

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="El Jeque" icon={Gem} color="cyan">
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-cyan-500 uppercase tracking-widest font-black mb-1">
              MAYOR INVERSOR
            </div>

            <Link href={`/user/${winner.id || ''}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-cyan-500 group-hover:brightness-110 transition-colors truncate px-2 leading-tight">
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

          {/* Runner-ups List */}
          {runnerUps.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {runnerUps.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold w-4">{index + 2}.</span>
                      <Link
                        href={`/user/${item.id}`}
                        className="text-zinc-300 hover:text-cyan-400 truncate"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <span className="text-zinc-400 font-semibold">
                      {formatEuro(item.total_spent)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ElegantCard>
    </div>
  );
}
