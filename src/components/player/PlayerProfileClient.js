'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';

// Modular Cards
import PlayerIdentityCard from '@/components/player/PlayerIdentityCard';
import PlayerMarketCard from '@/components/player/PlayerMarketCard';
import PlayerStatsCard from '@/components/player/PlayerStatsCard';
import PlayerHistoryCard from '@/components/player/PlayerHistoryCard';

export default function PlayerProfileClient({ player }) {
  if (!player) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header / Back Link */}
      <FadeIn delay={0}>
        <div>
          <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al dashboard
          </Link>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Identity Card (2 Cols) */}
        <div className="md:col-span-2">
            <FadeIn delay={100} className="h-full">
                <PlayerIdentityCard player={player} />
            </FadeIn>
        </div>

        {/* 2. Market Card (1 Col) */}
        <div className="md:col-span-1">
            <FadeIn delay={150} className="h-full">
                <PlayerMarketCard player={player} />
            </FadeIn>
        </div>

        {/* 3. Performance Card (1 Col) */}
        <div className="md:col-span-1">
             <FadeIn delay={200} className="h-full">
                <PlayerStatsCard player={player} />
             </FadeIn>
        </div>

        {/* 4. Match History (Full Width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <FadeIn delay={250}>
                 <PlayerHistoryCard recentMatches={player.recentMatches} />
            </FadeIn>
        </div>

      </div>
    </div>
  );
}
