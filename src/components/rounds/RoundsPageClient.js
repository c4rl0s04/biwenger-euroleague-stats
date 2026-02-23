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
  Plus,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { Subheading } from '@/components/ui';
import RoundStandings from './RoundStandings';
import RoundControls from './RoundControls';
import BasketballCourt from './BasketballCourt';
import Bench from './Bench';
import RoundStatsSidebar from './RoundStatsSidebar';
import RoundMVPCard from './stats/RoundMVPCard';
import StatLeaderCard from './stats/StatLeaderCard';
import PerformanceChart from './stats/history/PerformanceChart';
import HistoryStatCard from './stats/history/HistoryStatCard';
import PersonalBreakdownTable from './stats/history/PersonalBreakdownTable';
import LeagueLeaderboard from './stats/history/LeagueLeaderboard';
import EfficiencyHeatmap from './stats/history/EfficiencyHeatmap';
import ConsistencyRanking from './stats/history/ConsistencyRanking';
import PerfectRoundsCard from './stats/history/PerfectRoundsCard';
import LineupStatsCard from './stats/general/LineupStatsCard';
import { Section } from '@/components/layout';
import { usePerformanceStats } from '@/lib/hooks/usePerformanceStats';
import { Activity, BarChart3, Grid, Ruler, Layout } from 'lucide-react';

export default function RoundsPageClient() {
  const router = useRouter();
  const { currentUser } = useClientUser();

  // --- 1. CONFIG FETCHING ---
  const { data: lists, loading: listsLoading } = useApiData('/api/rounds/list');

  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [viewMode, setViewMode] = useState('user'); // 'user', 'ideal', 'user_ideal'

  // --- NEW: Multi-User Comparison State ---
  const [comparisonUserIds, setComparisonUserIds] = useState([]);
  const [comparisonHistories, setComparisonHistories] = useState({});
  const [chartMetrics, setChartMetrics] = useState({ actual: true, ideal: true });
  const [isCompareSelectorOpen, setIsCompareSelectorOpen] = useState(false);

  // --- NEW: Background Loading State ---
  const [loadBackgroundData, setLoadBackgroundData] = useState(false);

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
      const initialId = globalUser ? globalUser.id : lists.users[0].id;
      setSelectedUserId(initialId);

      // Initialize comparison with the primary user
      setComparisonUserIds((prev) => (prev.length === 0 ? [initialId] : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, currentUser]);

  // Sync: When user selects a DIFFERENT primary user (e.g. from Standings table),
  // optionally add them to the comparison list if it only contains 1 user.
  useEffect(() => {
    if (
      selectedUserId &&
      comparisonUserIds.length <= 1 &&
      !comparisonUserIds.includes(selectedUserId)
    ) {
      setComparisonUserIds([selectedUserId]);
    }
  }, [selectedUserId]);

  // --- 2. QUICK FETCH (Only selected user's data) ---
  const { data: quickRoundData, loading: quickDataLoading } = useApiData(
    selectedRoundId && selectedUserId
      ? `/api/rounds/stats?roundId=${selectedRoundId}&userId=${selectedUserId}&mode=quick`
      : null,
    { dependencies: [selectedRoundId, selectedUserId] }
  );

  // --- 2b. FULL FETCH (All users - Background load) ---
  const { data: fullRoundData, loading: fullDataLoading } = useApiData(
    selectedRoundId && loadBackgroundData
      ? `/api/rounds/stats?roundId=${selectedRoundId}&mode=full`
      : null,
    { skip: !loadBackgroundData, dependencies: [selectedRoundId] }
  );

  // --- 3. FETCH HISTORY (Primary User - For Stats Cards) ---
  const { data: historyData, loading: historyLoading } = useApiData(
    selectedUserId ? `/api/rounds/history?userId=${selectedUserId}` : null,
    { dependencies: [selectedUserId] }
  );
  const userHistory = historyData?.history || [];
  const historyStats = usePerformanceStats(userHistory);

  // --- 3b. FETCH LEADERBOARD (All Users Aggregated Stats) - BACKGROUND ---
  const { data: leaderboardData, loading: leaderboardLoading } = useApiData(
    loadBackgroundData ? '/api/rounds/leaderboard' : null,
    { skip: !loadBackgroundData }
  );

  // --- 3c. FETCH ALL USERS HISTORY (For Efficiency Heatmap) - BACKGROUND ---
  const { data: allHistoryData, loading: allHistoryLoading } = useApiData(
    loadBackgroundData ? '/api/rounds/all-history' : null,
    { skip: !loadBackgroundData }
  );

  // --- 3d. FETCH LINEUP STATS - BACKGROUND ---
  const { data: lineupStatsData, loading: lineupStatsLoading } = useApiData(
    loadBackgroundData ? '/api/rounds/lineup-stats' : null,
    { skip: !loadBackgroundData }
  );

  // --- NEW: Trigger background loads after main content is ready ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadBackgroundData(true);
    }, 200); // 200ms delay ensures main UI renders first
    return () => clearTimeout(timer);
  }, []);

  // --- 4. FETCH HISTORY (Comparison Users - For Chart) ---
  // This effect fetches history for any user in comparisonUserIds that we don't have yet.
  useEffect(() => {
    const fetchMissingHistories = async () => {
      const missingIds = comparisonUserIds.filter((id) => !comparisonHistories[id]);

      if (missingIds.length === 0) return;

      const newHistories = { ...comparisonHistories };

      // Parallel fetch for all missing IDs
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const data = await apiClient.get(`/api/rounds/history?userId=${id}`);
            if (data.success) {
              newHistories[id] = data.data.history;
            }
          } catch (e) {
            console.error(`Failed to fetch history for user ${id}`, e);
          }
        })
      );

      setComparisonHistories(newHistories);
    };

    fetchMissingHistories();
  }, [comparisonUserIds, comparisonHistories]);

  // Handlers
  const handlePlayerClick = (player) => {
    if (player?.player_id) router.push(`/player/${player.player_id}`);
  };

  const toggleUserInComparison = (userId) => {
    setComparisonUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (listsLoading)
    return (
      <div className="text-center py-20 animate-pulse text-zinc-500">
        Cargando datos de la temporada...
      </div>
    );

  // --- 3. DERIVE DATA FOR CHILDREN ---

  // Prepare Comparison Users objects
  const comparisonUsersList = lists?.users?.filter((u) => comparisonUserIds.includes(u.id)) || [];

  // A. Current User Context
  // Use quick data first (priority), fall back to full data when available
  const roundData = fullRoundData || quickRoundData;
  const currentUserStats = roundData?.users?.find((u) => String(u.id) === String(selectedUserId));

  // B. Construct props expected by children
  // Lineup Data (For Court)
  const lineupData = currentUserStats
    ? {
        players: currentUserStats.lineup?.players || [], // Use lineup from quick or full payload
        summary: {
          total_points: currentUserStats.points,
          round_rank: null, // We could calculate rank dynamically from the list if needed
        },
      }
    : null;

  // Stats Data (For Sidebar)
  const statsData = {
    global: roundData?.global,
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

  const isCourtLoading = quickDataLoading; // Use quick data loading state

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
              loading={quickDataLoading}
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
            {isBenchVisible && (
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
            {/* COMPARISON CONTROLS */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
              {/* Left: Metric Toggles */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-400">Métricas:</span>
                  <button
                    onClick={() => setChartMetrics((p) => ({ ...p, actual: !p.actual }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      chartMetrics.actual
                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    Puntos Reales
                  </button>
                  <button
                    onClick={() => setChartMetrics((p) => ({ ...p, ideal: !p.ideal }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      chartMetrics.ideal
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    Puntos Ideales
                  </button>
                </div>
              </div>

              {/* Right: User Selector */}
              <div className="flex flex-wrap items-center justify-end gap-2 max-w-full">
                {comparisonUserIds.map((id) => {
                  const u = lists?.users?.find((user) => user.id === id);
                  if (!u) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 bg-zinc-800 pl-1.5 pr-2 py-1 rounded-full border border-white/5"
                    >
                      <div className="w-4 h-4 rounded-full bg-zinc-700 overflow-hidden">
                        {u.icon && (
                          <img src={u.icon} alt={u.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-300">{u.name}</span>
                      {comparisonUserIds.length > 1 && (
                        <button
                          onClick={() => toggleUserInComparison(id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <div className="relative">
                  <button
                    onClick={() => setIsCompareSelectorOpen(!isCompareSelectorOpen)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg cursor-pointer"
                    title="Añadir usuario a comparar"
                  >
                    <Plus size={16} />
                  </button>

                  {isCompareSelectorOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsCompareSelectorOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 max-h-60 overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 p-1 custom-scrollbar">
                        {lists?.users?.map((user) => {
                          const isSelected = comparisonUserIds.includes(user.id);
                          return (
                            <button
                              key={user.id}
                              onClick={() => {
                                toggleUserInComparison(user.id);
                                setIsCompareSelectorOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer ${
                                isSelected ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden">
                                  {user.icon && (
                                    <img
                                      src={user.icon}
                                      alt={user.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <span>{user.name}</span>
                              </div>
                              {isSelected && <Check size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <PerformanceChart
              histories={comparisonHistories}
              comparisonUsers={comparisonUsersList}
              metrics={chartMetrics}
            />

            {historyStats && (
              <div className="space-y-3">
                <Subheading
                  title={`Estadísticas personales de ${lists?.users?.find((u) => u.id === selectedUserId)?.name || 'Usuario'}`}
                  className="mb-2"
                />
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

                {/* Personal Breakdown Table */}
                <ElegantCard
                  title="Desglose por Jornada"
                  icon={BarChart3}
                  color="indigo"
                  className="mt-4"
                >
                  <PersonalBreakdownTable history={userHistory} />
                </ElegantCard>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* SECTION: COMPARATIVA DE LIGA */}
      <Section title="Comparativa de Liga" delay={300} background="section-raised">
        {/* Row 1: Leaderboard full width */}
        <ElegantCard title="Clasificación por Eficiencia" icon={Trophy} color="yellow">
          <LeagueLeaderboard
            leaderboardData={leaderboardData?.leaderboard || []}
            users={lists?.users || []}
            loading={leaderboardLoading}
          />
        </ElegantCard>

        {/* Row 2: Split Layout - Heatmap & Stacked Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left: Heatmap */}
          <div className="h-full">
            <ElegantCard
              title="Mapa de Calor de Eficiencia"
              icon={Grid}
              color="indigo"
              className="h-full"
            >
              <EfficiencyHeatmap
                allUsersHistory={allHistoryData?.allUsersHistory || []}
                users={lists?.users || []}
                loading={allHistoryLoading}
              />
            </ElegantCard>
          </div>

          {/* Right: Stacked Cards */}
          <div className="flex flex-col gap-6">
            <ElegantCard title="Consistencia" icon={Ruler} color="cyan">
              <ConsistencyRanking
                allUsersHistory={allHistoryData?.allUsersHistory || []}
                users={lists?.users || []}
                loading={allHistoryLoading}
              />
            </ElegantCard>

            <ElegantCard title="Jornadas Perfectas" icon={Star} color="amber">
              <PerfectRoundsCard
                allUsersHistory={allHistoryData?.allUsersHistory || []}
                users={lists?.users || []}
                loading={allHistoryLoading}
              />
            </ElegantCard>
          </div>
        </div>

        {/* Row 3: Lineup Stats */}
        <div className="mt-6">
          <ElegantCard title="Alineaciones Preferidas" icon={Layout} color="purple">
            <LineupStatsCard
              globalStats={lineupStatsData?.global || []}
              userStats={lineupStatsData?.users || []}
            />
          </ElegantCard>
        </div>
      </Section>
    </div>
  );
}
