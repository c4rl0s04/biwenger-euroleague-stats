'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';

// Modular Cards
import PlayerIdentityCard from '@/components/player/PlayerIdentityCard';
import PlayerMarketCard from '@/components/player/PlayerMarketCard';
import PlayerStatsCard from '@/components/player/PlayerStatsCard';
import PlayerHistoryCard from '@/components/player/PlayerHistoryCard';
// New Cards
import PlayerBioCard from '@/components/player/PlayerBioCard';
import PlayerNextMatchCard from '@/components/player/PlayerNextMatchCard';
import PlayerPriceHistoryCard from '@/components/player/PlayerPriceHistoryCard';
import PlayerAdvancedStatsCard from '@/components/player/PlayerAdvancedStatsCard';
import PlayerOwnershipCard from '@/components/player/PlayerOwnershipCard';
import PlayerPointsGraph from '@/components/player/PlayerPointsGraph';
import PlayerSplitsCard from '@/components/player/PlayerSplitsCard';

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

      {/* Row 1: Identity (2), Bio (1), Next Match (1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2">
            <FadeIn delay={100} className="h-full">
                <PlayerIdentityCard player={player} />
            </FadeIn>
        </div>
        <div className="md:col-span-1">
             <FadeIn delay={150} className="h-full">
                <PlayerBioCard player={player} />
             </FadeIn>
        </div>
        <div className="md:col-span-1">
             <FadeIn delay={200} className="h-full">
                <PlayerNextMatchCard nextMatch={player.nextMatch} playerTeam={player.team} />
             </FadeIn>
        </div>
      </div>

       {/* Row 2: Market & Price Graph */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
             <FadeIn delay={250} className="h-full">
                 <PlayerMarketCard player={player} />
             </FadeIn>
          </div>
          <div className="lg:col-span-2">
             <FadeIn delay={300} className="h-full">
                 <PlayerPriceHistoryCard priceHistory={player.priceHistory} />
             </FadeIn>
          </div>
       </div>

       {/* Row 3: Performance & Advanced Stats */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1">
                <FadeIn delay={350} className="h-full">
                    <PlayerStatsCard player={player} />
                </FadeIn>
           </div>
           <div className="lg:col-span-2">
                <FadeIn delay={400} className="h-full">
                    <PlayerAdvancedStatsCard advancedStats={player.advancedStats} />
                </FadeIn>
           </div>
       </div>
       
       {/* Row 4: Graphs & Analysis */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
                <FadeIn delay={450} className="h-full">
                    <PlayerPointsGraph matches={player.recentMatches} />
                </FadeIn>
           </div>
           <div className="lg:col-span-1">
                <FadeIn delay={500} className="h-full">
                    <PlayerSplitsCard matches={player.recentMatches} playerTeam={player.team} />
                </FadeIn>
           </div>
       </div>

         {/* Row 5: Ownership History (If available) */}
        {player.transfers && player.transfers.length > 0 && (
            <div className="grid grid-cols-1">
                <FadeIn delay={450}>
                    <PlayerOwnershipCard transfers={player.transfers} />
                </FadeIn>
            </div>
        )}

      {/* Row 5: Match History Table */}
      <div className="grid grid-cols-1">
            <FadeIn delay={500}>
                 <PlayerHistoryCard recentMatches={player.recentMatches} />
            </FadeIn>
      </div>

    </div>
  );
}
