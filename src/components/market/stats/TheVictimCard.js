'use client';

import { Frown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function TheVictimCard({ data }) {
  if (!data) return null;

  return (
    <div className="h-full hover:scale-[1.02] transition-transform duration-200">
      <ElegantCard title="La Víctima" icon={Frown} color="pink">
        <div className="flex flex-col h-full justify-between">
          <div className="mt-2 text-center">
            <div className="text-sm text-pink-500 uppercase tracking-widest font-black mb-2">
              MÁS PUJAS PERDIDAS
            </div>

            <Link href={`/user/${data.id}`} className="block group">
              <div className="text-2xl md:text-3xl font-black text-pink-500 group-hover:text-pink-400 transition-colors truncate px-2 leading-tight">
                {data.name}
              </div>
            </Link>

            <div className="text-2xl md:text-3xl font-black text-white mt-2">
              {data.failed_bids_count}{' '}
              <span className="text-lg md:text-xl font-bold text-zinc-500">fracasos</span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">
              Intentos fallidos de fichaje
            </p>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
