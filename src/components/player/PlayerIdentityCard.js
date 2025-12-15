'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

export default function PlayerIdentityCard({ player, className = '' }) {
  return (
    <PremiumCard title="Ficha Técnica" icon={User} color="blue" className={`h-full ${className}`}>
        <div className="flex items-center gap-6 h-full">
            {/* Avatar */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-slate-700/50 shadow-xl shrink-0">
                {player.img ? (
                    <Image 
                    src={player.img} 
                    alt={player.name} 
                    fill
                    sizes="(max-width: 768px) 96px, 128px"
                    className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-500" />
                    </div>
                )}
            </div>
            {/* Info */}
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">{player.name}</h1>
                 <div className="flex flex-wrap items-center gap-2 text-slate-400">
                    <span className="font-semibold text-slate-200 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">{player.team}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    <span>{player.position}</span>
                 </div>
            </div>
        </div>
    </PremiumCard>
  );
}
