'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { ChevronLeft, ChevronRight, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import BasketballCourt from './BasketballCourt';
import BroadcastCourt from './BroadcastCourt';
import Bench from './Bench';
import CustomSelect from '@/components/ui/CustomSelect';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function RoundsPageClient() {
  // 1. Fetch Lists (Rounds & Users)
  const { data: lists, loading: listsLoading } = useApiData('/api/rounds/list');
  const { currentUser } = useClientUser();

  // State
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('broadcast'); // 'broadcast' | 'tactical'

  // Initialize selection when lists load
  // Initialize Round selection
  useEffect(() => {
    if (lists?.rounds && lists.rounds.length > 0 && !selectedRoundId) {
      setTimeout(() => {
        setSelectedRoundId(lists.defaultRoundId || lists.rounds[0].round_id);
      }, 0);
    }
  }, [lists, selectedRoundId]);

  // Initialize User selection
  useEffect(() => {
    if (lists?.users && lists.users.length > 0 && !selectedUserId) {
      const globalUserInList = currentUser && lists.users.find((u) => u.id === currentUser.id);
      setTimeout(() => {
        if (globalUserInList) {
          setSelectedUserId(globalUserInList.id);
        } else {
          setSelectedUserId(lists.users[0].id);
        }
      }, 0);
    }
  }, [lists, currentUser, selectedUserId]);

  // 2. Fetch Lineup Data
  const { data: lineupData, loading: lineupLoading } = useApiData(
    selectedRoundId && selectedUserId
      ? `/api/rounds/lineup?roundId=${selectedRoundId}&userId=${selectedUserId}`
      : null,
    {
      dependencies: [selectedRoundId, selectedUserId],
    }
  );

  if (listsLoading) {
    return <div className="text-center py-20 animate-pulse">Cargando datos...</div>;
  }

  // Helper to change round
  const changeRound = (direction) => {
    if (!lists?.rounds) return;
    const currentIndex = lists.rounds.findIndex((r) => r.round_id === selectedRoundId);
    let newIndex = direction === 'next' ? currentIndex - 1 : currentIndex + 1; // Rounds are DESC

    // Bounds check
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= lists.rounds.length) newIndex = lists.rounds.length - 1;

    setSelectedRoundId(lists.rounds[newIndex].round_id);
  };

  // Split lineup into starters and bench based on role
  const players = lineupData?.players || [];

  let starters = players.filter((p) => p.role === 'titular');
  let bench = players.filter((p) => p.role !== 'titular');

  // Fallback for older lineups without role (if any) or if only 5 players total
  if (starters.length === 0 && players.length > 0) {
    // If no role info, assume first 5 are starters (legacy behavior fallback)
    starters = players.slice(0, 5);
    bench = players.slice(5);
  }

  const currentRound = lists?.rounds?.find((r) => r.round_id === selectedRoundId);

  return (
    <div className="space-y-8">
      {/* CONTROLS HEADER */}
      <div className="flex flex-col gap-6">
        {/* Round Selector */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => changeRound('prev')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            disabled={
              lists?.rounds?.findIndex((r) => r.round_id === selectedRoundId) ===
              lists?.rounds?.length - 1
            }
          >
            <ChevronLeft size={24} />
          </button>

          <div className="text-center min-w-[200px]">
            {/* <h2 className="text-2xl font-bold font-display text-gradient">
              {currentRound?.round_name || 'Selecciona Jornada'}
            </h2> */}
            <CustomSelect
              value={selectedRoundId}
              onChange={setSelectedRoundId}
              options={
                lists?.rounds?.map((r) => ({ value: r.round_id, label: r.round_name })).reverse() ||
                []
              }
              className="w-[350px] mx-auto"
              buttonClassName="h-16 text-4xl font-bold font-display justify-center bg-transparent border-none hover:bg-white/10"
              placeholder="Selecciona Jornada"
            />
            <div className="text-sm text-muted-foreground -mt-1">
              {lineupData?.summary ? (
                <>
                  <span className="text-primary font-bold">
                    {lineupData.summary.total_points} pts
                  </span>
                  <span className="mx-2">•</span>
                  <span>Posición {lineupData.summary.round_rank}</span>
                </>
              ) : (
                'Sin participación'
              )}
            </div>
          </div>

          <button
            onClick={() => changeRound('next')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            disabled={lists?.rounds?.findIndex((r) => r.round_id === selectedRoundId) === 0}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* User Selector (Horizontal Scroll) */}
        <div className="flex justify-center overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 px-4">
            {lists?.users?.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[64px] transition-all p-2 rounded-xl',
                  selectedUserId === user.id
                    ? 'bg-white/10 scale-110'
                    : 'opacity-60 hover:opacity-100 hover:bg-white/5'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full overflow-hidden border-2 relative',
                    selectedUserId === user.id
                      ? 'border-primary shadow-lg shadow-primary/20'
                      : 'border-transparent'
                  )}
                >
                  {user.icon ? (
                    <Image
                      src={user.icon}
                      alt={user.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {user.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VISUALIZATION STAGE */}
      {/* VISUALIZATION STAGE */}
      <div
        className="relative min-h-[600px] transition-opacity duration-300"
        style={{ opacity: lineupLoading ? 0.5 : 1 }}
      >
        {players.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Court Card (Takes 2 columns on lg) */}
            <div className="lg:col-span-2">
              <ElegantCard
                title={
                  viewMode === 'broadcast' ? 'Quinteto Inicial (TV)' : 'Quinteto Inicial (Pizarra)'
                }
                icon={Trophy}
                className="h-full min-h-[650px]"
                color="orange"
                actionRight={
                  <div className="flex bg-secondary/50 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setViewMode('broadcast')}
                      className={cn(
                        'px-2 py-1 text-xs rounded-md transition-all',
                        viewMode === 'broadcast'
                          ? 'bg-primary text-white shadow'
                          : 'hover:bg-white/10 text-muted-foreground'
                      )}
                    >
                      TV
                    </button>
                    <button
                      onClick={() => setViewMode('tactical')}
                      className={cn(
                        'px-2 py-1 text-xs rounded-md transition-all',
                        viewMode === 'tactical'
                          ? 'bg-primary text-white shadow'
                          : 'hover:bg-white/10 text-muted-foreground'
                      )}
                    >
                      2D
                    </button>
                  </div>
                }
              >
                {viewMode === 'broadcast' ? (
                  <BroadcastCourt players={starters} onPlayerClick={(p) => console.log(p)} />
                ) : (
                  <BasketballCourt players={starters} onPlayerClick={(p) => console.log(p)} />
                )}
              </ElegantCard>
            </div>

            {/* Bench Card (Takes 1 column on lg) */}
            <div>
              <ElegantCard title="Banquillo" icon={User} className="h-full" color="blue">
                <Bench players={bench} viewMode={viewMode} onPlayerClick={(p) => console.log(p)} />
              </ElegantCard>
            </div>
          </div>
        ) : (
          <ElegantCard className="py-20 text-center text-muted-foreground">
            No hay alineación disponible para esta jornada.
          </ElegantCard>
        )}
      </div>
    </div>
  );
}
