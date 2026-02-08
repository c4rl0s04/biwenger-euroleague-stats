'use client';

import { Frown } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function TheVictimCard({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1);

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="La Víctima" icon={Frown} color="pink">
        <div className="flex flex-col h-full">
          {/* Winner Section */}
          <div className="mt-2 text-center">
            <div className="text-xs text-pink-500 uppercase tracking-widest font-black mb-1">
              MÁS PUJAS PERDIDAS
            </div>

            <Link href={`/user/${winner.id}`} className="block group">
              <div className="text-xl md:text-2xl font-black text-pink-500 group-hover:text-pink-400 transition-colors truncate px-2 leading-tight">
                {winner.name}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {winner.failed_bids_count}{' '}
              <span className="text-sm md:text-base font-bold text-zinc-500">fracasos</span>
            </div>
          </div>

          {/* Runner-ups List */}
          {runnerUps.length > 0 && (
            <div className="mt-3 border-t border-zinc-800 pt-2">
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
                        className="text-zinc-300 hover:text-pink-400 truncate"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <span className="text-zinc-400 font-semibold">{item.failed_bids_count}</span>
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
