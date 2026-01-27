'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Star, User } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import RoundStandings from './RoundStandings';
import RoundControls from './RoundControls';
import BasketballCourt from './BasketballCourt';
import Bench from './Bench';

export default function RoundsPageClient() {
  // --- 1. DATA FETCHING ---
  const { data: lists, loading: listsLoading } = useApiData('/api/rounds/list');
  const { currentUser } = useClientUser();

  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Initialize Round
  useEffect(() => {
    if (lists?.rounds?.length > 0 && !selectedRoundId) {
      setSelectedRoundId(lists.defaultRoundId || lists.rounds[0].round_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists]);

  // Initialize User
  useEffect(() => {
    if (lists?.users?.length > 0 && !selectedUserId) {
      const globalUser = currentUser && lists.users.find((u) => u.id === currentUser.id);
      setSelectedUserId(globalUser ? globalUser.id : lists.users[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, currentUser]);

  // Fetch Lineup
  const { data: lineupData, loading: lineupLoading } = useApiData(
    selectedRoundId && selectedUserId
      ? `/api/rounds/lineup?roundId=${selectedRoundId}&userId=${selectedUserId}`
      : null,
    { dependencies: [selectedRoundId, selectedUserId] }
  );

  const router = useRouter();

  // Handle navigation to player page
  const handlePlayerClick = (player) => {
    if (player?.player_id) {
      router.push(`/player/${player.player_id}`);
    }
  };

  if (listsLoading)
    return <div className="text-center py-20 animate-pulse text-zinc-500">Cargando...</div>;

  // Process Lineup Data (Split Starters/Bench)
  const players = lineupData?.players || [];
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
    starters = players.slice(0, 5);
    bench = players.slice(5);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ROW 1: CONTROLS (Full Width) */}
      <div className="lg:col-span-12">
        <ElegantCard title="Jornada" icon={Settings} className="w-full relative z-20" color="zinc">
          <RoundControls
            lists={lists}
            selectedRoundId={selectedRoundId}
            onChangeRound={setSelectedRoundId}
            lineupSummary={lineupData?.summary}
          />
        </ElegantCard>
      </div>

      {/* ROW 2: SPLIT VIEW */}

      {/* LEFT COLUMN: STANDINGS (Span 5) */}
      <div className="lg:col-span-5 space-y-6">
        <RoundStandings
          roundId={selectedRoundId}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
        />
      </div>

      {/* RIGHT COLUMN: LINEUP (Span 7) - Quinteto + Banquillo */}
      <div className="lg:col-span-7 space-y-6">
        {/* Quinteto Inicial */}
        <ElegantCard title="Quinteto Inicial" icon={Star} className="w-full" color="orange">
          <div className="w-full aspect-[4/3] lg:aspect-[16/10] min-h-[650px]">
            {lineupLoading ? (
              <div className="w-full h-full flex items-center justify-center animate-pulse bg-white/5 rounded-xl">
                Cargando...
              </div>
            ) : players.length > 0 ? (
              <BasketballCourt
                players={starters}
                onPlayerClick={handlePlayerClick}
                className="h-full w-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No hay alineación disponible.
              </div>
            )}
          </div>
        </ElegantCard>

        {/* Banquillo */}
        {players.length > 0 && (
          <ElegantCard title="Banquillo" icon={User} className="w-full" color="blue">
            <Bench players={bench} viewMode="tactical" onPlayerClick={handlePlayerClick} />
          </ElegantCard>
        )}
      </div>
    </div>
  );
}
