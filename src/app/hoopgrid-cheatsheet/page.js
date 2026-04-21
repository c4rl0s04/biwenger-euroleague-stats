import { db } from '@/lib/db';
import {
  hoopgridChallenges,
  players as playersTable,
  playerRoundStats,
  initialSquads,
  fichajes,
  users as usersTable,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Image from 'next/image';
import { HoopgridService } from '@/lib/services/features/hoopgridService';
import HoopgridCheatsheetHeader from '@/components/hoopgrid/HoopgridCheatsheetHeader';

// We'll replicate the checkCriteria logic here to keep it self-contained
// and avoid issues with private methods in HoopgridService
function checkCriteriaInMemory(player, criteria, statsMap, everOwnedIds, userOwnershipHistory) {
  const stats = statsMap.get(player.id) || [];

  if (criteria.type === 'user_ownership') {
    const { userId, mode } = criteria.value;
    const history = userOwnershipHistory.get(userId);
    if (mode === 'current') return player.ownerId === userId;
    if (mode === 'past') return history?.has(player.id) && player.ownerId !== userId;
    return false;
  }

  if (criteria.type === 'ownership') {
    const isCurrentlyOwned = player.ownerId !== null;
    const wasEverOwned = everOwnedIds.has(player.id);

    if (criteria.value === 'current') return isCurrentlyOwned;
    if (criteria.value === 'free') return !isCurrentlyOwned;
    if (criteria.value === 'ever') return wasEverOwned;
    if (criteria.value === 'never') return !wasEverOwned;
    if (criteria.value === 'past_not_current') return !isCurrentlyOwned && wasEverOwned;
    return false;
  }

  if (criteria.type === 'stat_avg') {
    if (stats.length === 0) return false;
    const sumVal = stats.reduce((acc, s) => acc + (s[criteria.value.field] || 0), 0);
    return sumVal / stats.length >= criteria.value.threshold;
  }
  if (criteria.type === 'stat_single') {
    return stats.some((s) => (s[criteria.value.field] || 0) >= criteria.value.threshold);
  }
  if (criteria.type === 'stat_total') {
    const sumVal = stats.reduce((acc, s) => acc + (s[criteria.value.field] || 0), 0);
    return sumVal >= criteria.value.threshold;
  }
  if (criteria.type === 'double_double') {
    return stats.some((s) => {
      const counts = [
        (s.points || 0) >= 10,
        (s.rebounds || 0) >= 10,
        (s.assists || 0) >= 10,
        (s.steals || 0) >= 10,
        (s.blocks || 0) >= 10,
      ].filter(Boolean).length;
      return counts >= 2;
    });
  }
  if (criteria.type === 'percentage') {
    const made = stats.reduce((acc, s) => acc + (s[criteria.value.madeField] || 0), 0);
    const att = stats.reduce((acc, s) => acc + (s[criteria.value.attField] || 0), 0);
    return att > 0 && made / att >= criteria.value.threshold;
  }
  if (criteria.type === 'team') return player.teamId === criteria.value;
  if (criteria.type === 'pos') return player.position === criteria.value;
  if (criteria.type === 'country') return player.country === criteria.value;
  if (criteria.type === 'price_min') return (player.price || 0) >= criteria.value;
  if (criteria.type === 'price_max') return (player.price || 0) <= criteria.value;
  if (criteria.type === 'height_min') return (player.height || 0) >= criteria.value;
  if (criteria.type === 'height_max') return (player.height || 0) <= criteria.value;
  if (criteria.type === 'age_min' || criteria.type === 'age_max') {
    if (!player.birthDate) return false;
    const birth = new Date(player.birthDate);
    const today = new Date();
    const age =
      today.getFullYear() -
      birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (criteria.type === 'age_min') return age >= criteria.value;
    return age <= criteria.value;
  }
  return false;
}

export default async function HoopgridCheatsheetPage({ searchParams }) {
  const params = await searchParams;
  const dateParam = params.date;
  const today = new Date().toISOString().split('T')[0];
  const targetDate = dateParam || today;

  // 1. Fetch current challenge and ALL challenges for the dropdown
  const [challenge, rawAllChallenges] = await Promise.all([
    db.query.hoopgridChallenges.findFirst({
      where: eq(hoopgridChallenges.gameDate, targetDate),
    }),
    db.query.hoopgridChallenges.findMany({
      orderBy: desc(hoopgridChallenges.gameDate),
    }),
  ]);

  if (!challenge) {
    return (
      <div className="p-20 text-center bg-background min-h-screen text-foreground">
        <h1 className="text-2xl font-bold">No challenge found for {targetDate}</h1>
        <a href="/hoopgrid-cheatsheet" className="text-primary hover:underline mt-4 inline-block">
          Return to Today
        </a>
      </div>
    );
  }

  // Calculate complexity for the dropdown
  const allChallenges = rawAllChallenges.map((ch) => ({
    ...ch,
    complexity: HoopgridService.calculateComplexity(ch.possibleCounts),
  }));

  // Calculate prev/next
  const current = new Date(targetDate);
  const prev = new Date(current);
  prev.setDate(prev.getDate() - 1);
  const prevStr = prev.toISOString().split('T')[0];

  const next = new Date(current);
  next.setDate(next.getDate() + 1);
  const nextStr = next.toISOString().split('T')[0];
  const isLatest = targetDate === today;

  const rows = typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows;
  const cols = typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols;

  // 1. Fetch all data
  const [allPlayers, allStats, allInitial, allFichajes, allUsersList] = await Promise.all([
    db.select().from(playersTable),
    db.select().from(playerRoundStats),
    db.select().from(initialSquads),
    db.select().from(fichajes),
    db.select().from(usersTable),
  ]);

  // 2. Build Helper Maps
  const userOwnershipHistory = new Map();
  const allUsers = Array.from(
    new Set([...allInitial.map((i) => i.userId), ...allFichajes.map((f) => f.comprador)])
  ).filter((u) => !!u);

  // Initialize for all known managers
  allUsersList.forEach((u) => userOwnershipHistory.set(u.id, new Set()));

  // Add initial squads
  allInitial.forEach((i) => userOwnershipHistory.get(i.userId)?.add(i.playerId));

  // Add transfers with name-to-ID resolution
  allFichajes.forEach((f) => {
    if (f.comprador) {
      let ownerId = f.comprador;
      if (!userOwnershipHistory.has(f.comprador)) {
        const found = allUsersList.find((u) => u.name === f.comprador);
        if (found) ownerId = found.id;
      }
      userOwnershipHistory.get(ownerId)?.add(f.playerId);
    }
  });

  const everOwnedIds = new Set();
  userOwnershipHistory.forEach((set) => set.forEach((id) => everOwnedIds.add(id)));

  const statsMap = new Map();
  for (const s of allStats) {
    if (!statsMap.get(s.playerId)) statsMap.set(s.playerId, []);
    statsMap.get(s.playerId).push(s);
  }

  // 3. Solve the grid
  const solutions = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const validPlayers = allPlayers.filter(
        (p) =>
          checkCriteriaInMemory(p, rows[r], statsMap, everOwnedIds, userOwnershipHistory) &&
          checkCriteriaInMemory(p, cols[c], statsMap, everOwnedIds, userOwnershipHistory)
      );
      solutions.push({
        rowLabel: rows[r].label,
        colLabel: cols[c].label,
        players: validPlayers.sort((a, b) => (b.price || 0) - (a.price || 0)),
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <HoopgridCheatsheetHeader
          allChallenges={allChallenges}
          currentDate={targetDate}
          currentNumber={challenge.number}
          prevDate={prevStr}
          nextDate={nextStr}
          isLatest={isLatest}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {solutions.map((cell, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-[650px] shadow-sm"
            >
              <div className="p-5 border-b border-border bg-muted/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">
                    Cell {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    {cell.players.length} Results
                  </span>
                </div>
                <h2 className="text-lg font-bold truncate">
                  {cell.rowLabel} <span className="text-muted-foreground mx-1">×</span>{' '}
                  {cell.colLabel}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
                {cell.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                      {player.img ? (
                        <Image src={player.img} alt={player.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-20">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{player.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span>{player.teamId}</span>
                        <span className="text-primary font-bold">
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0,
                          }).format(player.price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
