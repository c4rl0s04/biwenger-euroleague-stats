'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Star,
  User,
  Users,
  BrainCircuit,
  TrendingDown,
  Target,
  Trophy,
} from 'lucide-react';

import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import RoundStandings from './RoundStandings';
import RoundControls from './RoundControls';
import BasketballCourt from './BasketballCourt';
import Bench from './Bench';
import RoundStatsSidebar from './RoundStatsSidebar';
import RoundMVPCard from './stats/RoundMVPCard';
import StatLeaderCard from './stats/StatLeaderCard';
import PerformanceChart from './stats/history/PerformanceChart';
import HistoryStatCard from './stats/history/HistoryStatCard';
import { Section } from '@/components/layout';
import { usePerformanceStats } from '@/lib/hooks/usePerformanceStats';
import { Activity } from 'lucide-react';

export default function RoundsPageClient() {
  const router = useRouter();
  const { currentUser } = useClientUser();

  // --- 1. CONFIG FETCHING ---
  const { data: lists, loading: listsLoading } = useApiData('/api/rounds/list');

  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('user'); // 'user', 'ideal', 'user_ideal'

  // Initialize Round & User
  useEffect(() => {
    if (lists?.rounds?.length > 0 && !selectedRoundId) {
      setSelectedRoundId(lists.defaultRoundId || lists.rounds[0].round_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists]);

  useEffect(() => {
    if (lists?.users?.length > 0 && !selectedUserId) {
      const globalUser = currentUser && lists.users.find((u) => u.id === currentUser.id);
      setSelectedUserId(globalUser ? globalUser.id : lists.users[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, currentUser]);

  // --- 2. MEGA FETCH (One-Shot for everything in the round) ---
  const { data: fullRoundData, loading: dataLoading } = useApiData(
    selectedRoundId ? `/api/rounds/stats?roundId=${selectedRoundId}&mode=full` : null,
    { dependencies: [selectedRoundId] }
  );

  // --- 3. FETCH HISTORY (For the new section) ---
  // --- 3. FETCH HISTORY (For the new section) ---
  const { data: historyData, loading: historyLoading } = useApiData(
    selectedUserId ? `/api/rounds/history?userId=${selectedUserId}` : null,
    { dependencies: [selectedUserId] }
  );
  const userHistory = historyData?.history || [];
  const historyStats = usePerformanceStats(userHistory);

  const handlePlayerClick = (player) => {
    if (player?.player_id) router.push(`/player/${player.player_id}`);
  };

  if (listsLoading)
    return (
      <div className="text-center py-20 animate-pulse text-zinc-500">
        Cargando datos de la temporada...
      </div>
    );

  // --- 3. DERIVE DATA FOR CHILDREN ---

  // A. Current User Context
  // Find selected user within the mega list
  const currentUserStats = fullRoundData?.users?.find(
    (u) => String(u.id) === String(selectedUserId)
  );

  // B. Construct props expected by children
  // Lineup Data (For Court)
  const lineupData = currentUserStats
    ? {
        players: currentUserStats.lineup?.players || [], // Use lineup from mega payload
        summary: {
          total_points: currentUserStats.points,
          round_rank: null, // We could calculate rank dynamically from the list if needed
        },
      }
    : null;

  // Stats Data (For Sidebar)
  const statsData = {
    global: fullRoundData?.global,
    idealLineup: fullRoundData?.idealLineup,
    user: currentUserStats
      ? {
          ...currentUserStats, // points, ideal_points
          coachRating: currentUserStats.coachRating,
          idealLineup: currentUserStats.idealLineup,
          leftOut: currentUserStats.leftOut,
        }
      : null,
  };

  // --- 4. VIEW LOGIC (Court Display) ---
  const userPlayers = lineupData?.players || [];
  let starters = userPlayers.filter((p) => p.role === 'titular');
  let bench = userPlayers
    .filter((p) => p.role !== 'titular')
    .sort((a, b) => (a.role === '6th_man' ? -1 : 1));

  // Fallback for missing roles in actual lineup
  if (starters.length === 0 && userPlayers.length > 0) {
    starters = userPlayers.slice(0, 5);
    bench = userPlayers.slice(5);
  }

  // Determine players for views
  let currentStarters = starters;
  let currentBench = bench;
  let isBenchVisible = viewMode === 'user';
  let title = 'Quinteto Inicial';
  let icon = User;
  let color = 'orange';

  // 1. GLOBAL IDEAL (Best 10 in League)
  if (viewMode === 'ideal') {
    const idealAll = statsData?.idealLineup || [];
    currentStarters = idealAll.filter((p) => p.role === 'titular');
    currentBench = idealAll.filter((p) => p.role !== 'titular');
    isBenchVisible = true;
    title = 'Quinteto Ideal Jornada';
    icon = Star;
    color = 'purple';
  }
  // 2. USER IDEAL (Best 10 Owned)
  else if (viewMode === 'user_ideal') {
    const idealAll = statsData?.user?.idealLineup || [];
    currentStarters = idealAll.filter((p) => p.role === 'titular');
    currentBench = idealAll.filter((p) => p.role !== 'titular');
    isBenchVisible = true;
    title = 'Mi Alineación Perfecta';
    icon = BrainCircuit;
    color = 'emerald';
  }

  const isCourtLoading = dataLoading; // Use master loading state

  // 3. Dynamic Summary for Header
  let currentSummary = lineupData?.summary; // Default to User Actual

  if (viewMode === 'user_ideal' && statsData?.user?.coachRating) {
    currentSummary = {
      total_points: statsData.user.coachRating.maxScore,
      round_rank: null,
    };
  } else if (viewMode === 'ideal' && statsData?.idealLineup) {
    // Calculate total using multipliers (Captain, 6thMan, Bench)
    const globalTotal = statsData.idealLineup.reduce((sum, p) => {
      const multiplier = p.multiplier || (p.role === 'titular' ? 1 : 0.5); // Fallback
      return sum + (p.points || 0) * multiplier;
    }, 0);

    currentSummary = {
      total_points: Math.round(globalTotal),
      round_rank: null,
    };
  }

  return (
    <div>
      {/* SECTION: ESTADISTICAS DE LA RONDA */}
      <Section title="Estadísticas de la Ronda" delay={0} background="section-base">
        {/* HEADER & CONTROLS */}
        <ElegantCard
          title="Panel de Jornada"
          icon={Settings}
          className="relative z-20"
          color="zinc"
        >
          <RoundControls
            lists={lists}
            selectedRoundId={selectedRoundId}
            onChangeRound={setSelectedRoundId}
            lineupSummary={currentSummary}
          />
        </ElegantCard>

        {/* MAIN LAYOUT - 2 COLUMNS ON XL (Flexbox for equal height) */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* LEFT COLUMN: STANDINGS + STATS (1/3 width) */}
          <div className="xl:w-1/3 flex flex-col justify-between gap-6">
            <RoundStandings
              roundId={selectedRoundId}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
              standings={fullRoundData?.users} // PASS PROPS DOWN
            />

            {/* Moved Stats Sidebar here to fill vertical space */}
            <RoundStatsSidebar
              stats={statsData}
              loading={dataLoading}
              roundId={selectedRoundId}
              userId={selectedUserId}
              leftOutPlayers={statsData?.user?.leftOut || []}
              coachRating={statsData?.user?.coachRating}
              currentRoundStatus={
                lists?.rounds?.find((r) => String(r.round_id) === String(selectedRoundId))
                  ?.status || 'finished'
              }
              summary={currentSummary}
              viewMode={viewMode}
            />
          </div>

          {/* RIGHT COLUMN: COURT + BENCH (2/3 width) */}
          <div className="xl:w-2/3 flex flex-col gap-4">
            {/* View Toggles */}
            <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/5 w-fit mx-auto">
              <button
                onClick={() => setViewMode('user')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'user' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                <User size={12} /> Alineación
              </button>
              <button
                onClick={() => setViewMode('user_ideal')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'user_ideal' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                <BrainCircuit size={12} /> Mi Ideal
              </button>
              <button
                onClick={() => setViewMode('ideal')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${viewMode === 'ideal' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                <Star size={12} /> Global
              </button>
            </div>

            <ElegantCard title={title} icon={icon} color={color} className="w-full">
              <div className="w-full aspect-[4/3] lg:aspect-[16/10] min-h-[500px] xl:min-h-[600px]">
                {isCourtLoading ? (
                  <div className="w-full h-full flex items-center justify-center animate-pulse bg-white/5 rounded-xl">
                    Cargando datos...
                  </div>
                ) : (
                  <BasketballCourt
                    players={currentStarters}
                    onPlayerClick={handlePlayerClick}
                    className="h-full w-full"
                  />
                )}
              </div>
            </ElegantCard>

            {/* Bench */}
            {isBenchVisible && currentBench.length > 0 && (
              <div className="mt-4">
                <ElegantCard
                  title="Banquillo"
                  icon={Users}
                  className="w-full opacity-90"
                  color="blue"
                >
                  <Bench
                    players={currentBench}
                    viewMode="tactical"
                    onPlayerClick={handlePlayerClick}
                  />
                </ElegantCard>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* SECTION: PLAYER STATS */}
      <Section title="Estadísticas de Jugadores" delay={100} background="section-raised">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* MVP - Fantasy Points Leader */}
          <StatLeaderCard
            player={statsData?.global?.mvp}
            statType="mvp"
            statValue={statsData?.global?.mvp?.points}
          />
          {/* Top Scorer - Real Points */}
          <StatLeaderCard
            player={statsData?.global?.topScorer}
            statType="points"
            statValue={statsData?.global?.topScorer?.stat_value}
          />
          {/* Top Rebounder */}
          <StatLeaderCard
            player={statsData?.global?.topRebounder}
            statType="rebounds"
            statValue={statsData?.global?.topRebounder?.stat_value}
          />
          {/* Top Assister */}
          <StatLeaderCard
            player={statsData?.global?.topAssister}
            statType="assists"
            statValue={statsData?.global?.topAssister?.stat_value}
          />
        </div>
      </Section>

      {/* SECTION: HISTORIAL DE RENDIMIENTO */}
      <Section title="Historial de Rendimiento" delay={200} background="section-base">
        {historyLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-white/5 rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              <div className="h-24 bg-white/5 rounded-xl" />
              <div className="h-24 bg-white/5 rounded-xl" />
              <div className="h-24 bg-white/5 rounded-xl" />
              <div className="h-24 bg-white/5 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <PerformanceChart history={userHistory} />

            {historyStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HistoryStatCard
                  title="Eficiencia Media"
                  value={historyStats.avgEfficiency}
                  subValue={`${historyStats.roundsPlayed} jornadas jugadas`}
                  icon={Target}
                  color="blue"
                />
                <HistoryStatCard
                  title="Puntos Perdidos"
                  value={`-${historyStats.totalLost}`}
                  subValue={`de ${historyStats.totalIdeal} posibles`}
                  icon={TrendingDown}
                  color="red"
                />
                <HistoryStatCard
                  title="Mejor Jornada"
                  value={historyStats.bestRound?.actual_points}
                  subValue={`Jornada ${historyStats.bestRound?.round_number}`}
                  icon={Trophy}
                  color="yellow"
                />
                <HistoryStatCard
                  title="Mayor Eficiencia"
                  value={`${historyStats.bestEffRound?.efficiency}%`}
                  subValue={`Jornada ${historyStats.bestEffRound?.round_number}`}
                  icon={Target}
                  color="emerald"
                />
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
