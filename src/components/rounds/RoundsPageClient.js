'use client';

import { useState, useEffect } from 'react';
import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import RoundStandings from './RoundStandings';
import RoundControls from './RoundControls';
import RoundLineupView from './RoundLineupView';

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
  }, [lists, selectedRoundId]);

  // Initialize User
  useEffect(() => {
    if (lists?.users?.length > 0 && !selectedUserId) {
      const globalUser = currentUser && lists.users.find((u) => u.id === currentUser.id);
      setSelectedUserId(globalUser ? globalUser.id : lists.users[0].id);
    }
  }, [lists, currentUser, selectedUserId]);

  // Fetch Lineup
  const { data: lineupData, loading: lineupLoading } = useApiData(
    selectedRoundId && selectedUserId
      ? `/api/rounds/lineup?roundId=${selectedRoundId}&userId=${selectedUserId}`
      : null,
    { dependencies: [selectedRoundId, selectedUserId] }
  );

  if (listsLoading) return <div className="text-center py-20 animate-pulse text-zinc-500">Cargando...</div>;

  return (
    <div className="space-y-8">
      {/* 1. HEADER CONTROLS */}
      <RoundControls 
         lists={lists} 
         selectedRoundId={selectedRoundId} 
         onChangeRound={setSelectedRoundId} 
         lineupSummary={lineupData?.summary} 
      />
      
      {/* 2. MAIN LAYOUT - Standard Flex Columns */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN (Standings) 
            - No 'sticky', no 'top-0'. 
            - It behaves like a normal div.
        */}
        <div className="w-full lg:w-[550px] shrink-0">
             <RoundStandings 
                roundId={selectedRoundId} 
                selectedUserId={selectedUserId} 
                onSelectUser={setSelectedUserId}
             />
        </div>

        {/* RIGHT COLUMN (Lineup) */}
        <div className="flex-1 min-w-0 w-full">
          <RoundLineupView 
             players={lineupData?.players || []} 
             loading={lineupLoading}
          />
        </div>

      </div>
    </div>
  );
}