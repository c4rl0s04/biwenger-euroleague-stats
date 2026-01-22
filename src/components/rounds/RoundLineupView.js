'use client';

import { Trophy, User } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import BasketballCourt from './BasketballCourt';
import Bench from './Bench';

export default function RoundLineupView({ players = [], loading = false }) {
  // Split lineup into starters and bench based on role
  let starters = players.filter((p) => p.role === 'titular');
  let bench = players.filter((p) => p.role !== 'titular');
  
  // Sort bench: '6th_man' should be first
  bench.sort((a, b) => {
    if (a.role === '6th_man') return -1;
    if (b.role === '6th_man') return 1;
    return 0;
  });

  // Fallback for older lineups without role (if any) or if only 5 players total
  if (starters.length === 0 && players.length > 0) {
    // If no role info, assume first 5 are starters (legacy behavior fallback)
    starters = players.slice(0, 5);
    bench = players.slice(5);
  }

  return (
    <div 
      className="space-y-6 transition-opacity duration-300"
      style={{ opacity: loading ? 0.5 : 1 }}
    >
      {players.length > 0 ? (
        <>
          {/* Court Section */}
          <ElegantCard
            title="Quinteto Inicial"
            icon={Trophy}
            className="w-full"
            color="orange"
          >
            {/* Responsive Container for Court */}
            <div className="w-full aspect-[4/3] lg:aspect-video min-h-[500px]">
              <BasketballCourt 
                players={starters} 
                onPlayerClick={(p) => console.log(p)} 
                className="h-full w-full"
              />
            </div>
          </ElegantCard>

          {/* Bench Section */}
          <ElegantCard title="Banquillo" icon={User} className="w-full" color="blue">
            <Bench players={bench} viewMode="tactical" onPlayerClick={(p) => console.log(p)} />
          </ElegantCard>
        </>
      ) : (
        <ElegantCard className="py-20 text-center text-muted-foreground">
            No hay alineación disponible para esta jornada.
        </ElegantCard>
      )}
    </div>
  );
}
