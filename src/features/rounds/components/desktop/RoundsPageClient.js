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
  TrendingUp,
  Calendar,
} from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { RoundCard } from '../RoundCard';
import { RoundComparisonControls } from './RoundComparisonControls';
import { SectionHeader } from '@/components/ui/foundation';
import RoundStandings from './RoundStandings';
import RoundControls from './RoundControls';
import { RoundViewSwitcher } from './RoundViewSwitcher';
import BasketballCourt from './BasketballCourt';
import Bench from './Bench';
import RoundStatsSidebar from './RoundStatsSidebar';
import StatLeaderCard from './stats/StatLeaderCard';
import PerformanceChart from './stats/history/PerformanceChart';
import HistoryStatCard from './stats/history/HistoryStatCard';
import PersonalBreakdownTable from './stats/history/PersonalBreakdownTable';
import LeagueLeaderboard from './stats/history/LeagueLeaderboard';
import EfficiencyHeatmap from './stats/history/EfficiencyHeatmap';
import ConsistencyRanking from './stats/history/ConsistencyRanking';
import PerfectRoundsCard from './stats/history/PerfectRoundsCard';
import RecordsGrid from './stats/history/RecordsGrid';
import LineupStatsCard from './stats/general/LineupStatsCard';
import { RoundPageSection as Section } from '../RoundPageSection';
import {
  Button,
  EmptyState,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/foundation';
import { cn } from '@/lib/utils';
import { useRoundStatsData } from '../../hooks/useRoundStatsData';
import { selectRoundManager, hasMissingRoundPoints } from '../../logic/desktop-round';
import { usePerformanceStats } from '../../hooks/usePerformanceStats';
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

  // --- NEW: Background Loading State ---
  const [loadBackgroundData, setLoadBackgroundData] = useState(false);

  // Initialize Round & User
  useEffect(() => {
    if (lists?.rounds?.length > 0 && !selectedRoundId) {
      if (lists.defaultRoundId) {
        setSelectedRoundId(lists.defaultRoundId);
      }
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
  }, [selectedUserId, comparisonUserIds]);

  const { quick, full } = useRoundStatsData(selectedRoundId, selectedUserId, loadBackgroundData);
  const quickRoundData = quick.data;
  const fullRoundData = full.data;
  const quickDataLoading = quick.loading;

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
      <div className="text-center py-20 animate-pulse text-muted-foreground">
        Cargando datos de la temporada...
      </div>
    );

  // --- 3. DERIVE DATA FOR CHILDREN ---

  // Prepare Comparison Users objects
  const comparisonUsersList = lists?.users?.filter((u) => comparisonUserIds.includes(u.id)) || [];

  // A. Current User Context
  // Use quick data first (priority), fall back to full data when available
  const roundData = quickRoundData || fullRoundData;
  const currentUserStats = selectRoundManager(quickRoundData, fullRoundData, selectedUserId);
  const roundStatus = lists?.rounds?.find(
    (round) => String(round.round_id) === String(selectedRoundId)
  )?.status;
  const pointsPending =
    !currentUserStats?.lineup?.players.length ||
    currentUserStats.lineup.players.every(hasMissingRoundPoints);

  // B. Construct props expected by children
  // Lineup Data (For Court)
  const lineupData = currentUserStats
    ? {
        players: currentUserStats.lineup?.players || [], // Use lineup from quick or full payload
        summary: {
          total_points: pointsPending ? null : currentUserStats.points,
          provisional: roundStatus === 'live',
          round_rank: null, // We could calculate rank dynamically from the list if needed
        },
      }
    : null;

  // Stats Data (For Sidebar)
  const statsData = {
    global: roundData?.global,
    idealLineup: fullRoundData?.idealLineup || roundData?.idealLineup,
    globalIdealPoints: fullRoundData?.globalIdealPoints ?? roundData?.globalIdealPoints,
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

  const hasCourtPlayers = currentStarters.length + currentBench.length > 0;
  const isCourtLoading = !hasCourtPlayers && (quick.loading || full.loading);
  const courtError =
    (viewMode === 'user' && currentUserStats?.lineupStatus === 'error') ||
    (!roundData && (quick.error || full.error));

  // 3. Dynamic Summary for Header
  let currentSummary = lineupData?.summary; // Default to User Actual

  if (viewMode === 'user_ideal' && statsData?.user?.coachRating) {
    currentSummary = {
      total_points: statsData.user.coachRating.maxScore,
      round_rank: null,
    };
  } else if (viewMode === 'ideal' && statsData?.idealLineup) {
    currentSummary = {
      total_points: statsData.globalIdealPoints || 0,
      round_rank: null,
    };
  }

  if (currentSummary && roundStatus === 'live')
    currentSummary = { ...currentSummary, provisional: true };

  const CourtIcon = icon;

  return (
    <div>
      {/* SECTION: ESTADISTICAS DE LA RONDA */}
      <Section title="Estadísticas de la Ronda" delay={0} background="section-base">
        {/* HEADER & CONTROLS */}
        <RoundCard
          title="Panel de Jornada"
          icon={Settings}
          color="zinc"
          className="relative z-20 h-fit"
        >
          <RoundControls
            lists={lists}
            selectedRoundId={selectedRoundId}
            onChangeRound={setSelectedRoundId}
          />
        </RoundCard>

        {/* Independent standings and court columns keep row spacing stable. */}
        {roundStatus === 'live' && (
          <p className="my-4 text-sm text-muted-foreground" role="status">
            Jornada en directo · Puntuaciones y alineaciones ideales provisionales.
          </p>
        )}
        {!selectedRoundId ? (
          <Card className="mt-8">
            <EmptyState className="py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Calendar size={32} />
              </div>
              <CardTitle className="mb-2 text-xl!">Temporada en preparación</CardTitle>
              <p className="max-w-md mx-auto text-sm text-muted-foreground">
                Aún no se ha disputado ninguna jornada. Las puntuaciones, alineaciones y análisis
                estarán disponibles tan pronto como comience la competición. Puedes seleccionar una
                jornada en el selector superior para consultar el calendario.
              </p>
            </EmptyState>
          </Card>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {/* LEFT COLUMN: STANDINGS + STATS (1/3 width) */}
            <div className="min-w-0 flex flex-col gap-6">
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
            <div className="min-w-0 flex flex-col gap-4">
              {/* View Toggles */}
              <RoundViewSwitcher value={viewMode} onChange={setViewMode} />

              <Card role="region" aria-label="Alineación de la jornada">
                <CardHeader
                  icon={
                    <CourtIcon
                      size={20}
                      className={cn(
                        color === 'emerald'
                          ? 'text-emerald-500'
                          : color === 'purple'
                            ? 'text-purple-500'
                            : 'text-primary'
                      )}
                      aria-hidden="true"
                    />
                  }
                >
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent
                  className={
                    hasCourtPlayers
                      ? 'aspect-[3/4] min-h-[360px] sm:aspect-[4/3] sm:min-h-[500px] lg:aspect-[16/10] xl:min-h-[520px]'
                      : 'min-h-64'
                  }
                >
                  {isCourtLoading ? (
                    <div
                      className="min-h-64 h-full flex items-center justify-center animate-pulse rounded-xl text-muted-foreground"
                      role="status"
                    >
                      Cargando datos...
                    </div>
                  ) : !hasCourtPlayers ? (
                    <EmptyState
                      className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-8"
                      role="status"
                    >
                      <Calendar size={28} aria-hidden="true" className="text-muted-foreground" />
                      <p className="font-semibold text-foreground">
                        {courtError
                          ? 'No se ha podido cargar la alineación.'
                          : roundStatus === 'upcoming'
                            ? 'La jornada aún no ha comenzado.'
                            : viewMode !== 'user'
                              ? 'Alineación ideal pendiente de puntuaciones.'
                              : 'Alineación pendiente de sincronización.'}
                      </p>
                      <p className="max-w-sm leading-relaxed">
                        {courtError
                          ? 'No se han podido recuperar los datos guardados. Puedes volver a intentarlo.'
                          : roundStatus === 'upcoming'
                            ? 'Las alineaciones y puntuaciones estarán disponibles cuando comience la jornada.'
                            : viewMode !== 'user'
                              ? 'El equipo ideal se calculará cuando haya puntuaciones disponibles.'
                              : 'Aún no hemos recibido la alineación de este mánager para esta jornada. Reintentar solo vuelve a consultar los datos disponibles.'}
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          quick.retry();
                          full.retry();
                        }}
                      >
                        Reintentar
                      </Button>
                    </EmptyState>
                  ) : (
                    <BasketballCourt
                      players={currentStarters}
                      onPlayerClick={handlePlayerClick}
                      className="h-full w-full"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Bench */}
              {isBenchVisible && currentBench.length > 0 && (
                <div className="mt-4">
                  <RoundCard
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
                  </RoundCard>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* SECTION: PLAYER STATS */}
      {selectedRoundId && (
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
      )}

      {/* SECTION: HISTORIAL DE RENDIMIENTO */}
      <Section title="Historial de Rendimiento" delay={200} background="section-base">
        {historyLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-secondary rounded-xl" />
            <div className="grid grid-cols-4 gap-4">
              <div className="h-24 bg-secondary rounded-xl" />
              <div className="h-24 bg-secondary rounded-xl" />
              <div className="h-24 bg-secondary rounded-xl" />
              <div className="h-24 bg-secondary rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <RoundComparisonControls
              users={lists?.users || []}
              selectedIds={comparisonUserIds}
              metrics={chartMetrics}
              onToggleMetric={(metric) =>
                setChartMetrics((previous) => ({ ...previous, [metric]: !previous[metric] }))
              }
              onToggleUser={toggleUserInComparison}
            />

            <PerformanceChart
              histories={comparisonHistories}
              comparisonUsers={comparisonUsersList}
              metrics={chartMetrics}
            />

            {/* LEAGUE WIDE RECORDS */}
            {!leaderboardLoading && leaderboardData?.leaderboard && (
              <RecordsGrid
                leaderboardData={leaderboardData.leaderboard}
                users={lists?.users || []}
              />
            )}

            {historyStats && (
              <div className="space-y-3">
                <SectionHeader
                  level={3}
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
                <RoundCard
                  title="Desglose por Jornada"
                  icon={BarChart3}
                  color="indigo"
                  className="mt-4"
                >
                  <PersonalBreakdownTable history={userHistory} />
                </RoundCard>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* SECTION: COMPARATIVA DE LIGA */}
      <Section title="Comparativa de Liga" delay={300} background="section-raised">
        {/* Row 1: Leaderboard full width */}
        <RoundCard title="Clasificación por Eficiencia" icon={Trophy} color="yellow">
          <LeagueLeaderboard
            leaderboardData={leaderboardData?.leaderboard || []}
            users={lists?.users || []}
            loading={leaderboardLoading}
          />
        </RoundCard>

        {/* Row 2: Split Layout - Heatmap & Stacked Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left: Heatmap */}
          <div className="h-full">
            <RoundCard
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
            </RoundCard>
          </div>

          {/* Right: Stacked Cards */}
          <div className="flex flex-col gap-6">
            <RoundCard title="Consistencia" icon={Ruler} color="cyan">
              <ConsistencyRanking
                allUsersHistory={allHistoryData?.allUsersHistory || []}
                users={lists?.users || []}
                loading={allHistoryLoading}
              />
            </RoundCard>

            <RoundCard title="Jornadas Perfectas" icon={Star} color="amber">
              <PerfectRoundsCard
                allUsersHistory={allHistoryData?.allUsersHistory || []}
                users={lists?.users || []}
                loading={allHistoryLoading}
              />
            </RoundCard>
          </div>
        </div>

        {/* Row 3: Lineup Stats */}
        <div className="mt-6">
          <RoundCard title="Alineaciones Preferidas" icon={Layout} color="purple">
            <LineupStatsCard
              globalStats={lineupStatsData?.global || []}
              userStats={lineupStatsData?.users || []}
            />
          </RoundCard>
        </div>
      </Section>
    </div>
  );
}
