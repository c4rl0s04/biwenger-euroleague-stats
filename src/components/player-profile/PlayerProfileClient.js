'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FadeIn, BackButton } from '@/components/ui';
import {
  PlayerIdentityCard,
  PlayerMarketCard,
  PlayerStatsCard,
  PlayerHistoryCard,
  PlayerNextMatchCard,
  PlayerPriceHistoryCard,
  PlayerAdvancedStatsCard,
  PlayerOwnershipCard,
  PlayerPointsGraph,
  PlayerSplitsCard,
} from '@/components/player-profile';

export default function PlayerProfileClient({ player }) {
  if (!player) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header / Back Link */}
      <FadeIn delay={0}>
        <div className="mb-4">
          <BackButton />
        </div>
      </FadeIn>

      {/* Row 1: Hero Card (Identity merged with Bio) */}
      <FadeIn delay={100}>
        <div className="w-full">
          <PlayerIdentityCard player={player} />
        </div>
      </FadeIn>

      {/* Row 2: Next Match, Market, Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FadeIn delay={150} className="h-full">
          <PlayerNextMatchCard nextMatch={player.nextMatch} playerTeam={player.team} />
        </FadeIn>

        <FadeIn delay={200} className="h-full">
          <PlayerMarketCard player={player} />
        </FadeIn>

        <FadeIn delay={250} className="h-full">
          <PlayerStatsCard player={player} />
        </FadeIn>
      </div>

      {/* Row 2: Market & Price Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <FadeIn delay={300} className="h-full">
            <PlayerPriceHistoryCard priceHistory={player.priceHistory} />
          </FadeIn>
        </div>
      </div>

      {/* Row 3: Performance & Advanced Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <FadeIn delay={400} className="h-full">
            <PlayerAdvancedStatsCard advancedStats={player.advancedStats} />
          </FadeIn>
        </div>
      </div>

      {/* Row 4: Graphs & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FadeIn delay={450} className="h-full">
            <PlayerPointsGraph matches={player.recentMatches} playerTeam={player.team} />
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
          <PlayerHistoryCard recentMatches={player.recentMatches} playerTeam={player.team} />
        </FadeIn>
      </div>
    </div>
  );
}
