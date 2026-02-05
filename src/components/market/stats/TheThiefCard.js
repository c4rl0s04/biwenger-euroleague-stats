'use client';

import { Swords } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function TheThiefCard({ data }) {
  if (!data) return null;

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard
        title="El Ladrón"
        icon={Swords}
        color="red"
        info="El usuario que ha ganado más fichajes habiendo otras pujas de rivales."
      >
        <div className="flex flex-col h-full justify-between">
          <div className="mt-4 text-center">
            <div className="text-sm text-red-500 uppercase tracking-widest font-black mb-2">
              MÁS ROBOS
            </div>

            <Link href={`/user/${data.id}`} className="block group">
              <div className="text-2xl md:text-3xl font-black text-red-500 group-hover:text-red-400 transition-colors truncate px-2 leading-tight">
                {data.name}
              </div>
            </Link>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {data.stolen_count}{' '}
              <span className="text-lg md:text-xl font-bold text-zinc-500">fichajes</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm px-4 py-2 rounded-full">
              <Swords size={16} className="text-red-400" />
              <span className="text-sm text-zinc-300">
                Ganados con <strong>competencia</strong>
              </span>
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
