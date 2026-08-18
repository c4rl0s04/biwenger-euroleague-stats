import type { SeasonMonteCarloResult, SeasonSimulationDataset } from './simulation-types';
import type { SimulationCalibrationReport } from './types';

export interface HistoricalSimulationSource {
  users: Array<{ id: string; name: string }>;
  userRounds: Array<{
    user_id: string;
    round_id: number;
    participated: boolean;
    round_date: string | null;
  }>;
  lineups: Array<{ user_id: string; round_id: number; player_id: number }>;
  playerStats: Array<{
    round_id: number;
    player_id: number;
    fantasy_points: number;
    position: string | null;
  }>;
  initialSquads: Array<{ user_id: string; player_id: number; price: number }>;
  marketValues: Array<{ date: string; player_id: number; price: number }>;
}

const dayOf = (value: string) => value.slice(0, 10);

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

const calibrationPrecision = (value: number) => Number(value.toFixed(6));

export function calibrateSeasonSimulator(
  observed: {
    transfers: number;
    finalResourceGini: number;
    finalSquadGini: number;
  },
  simulated: Pick<
    SeasonMonteCarloResult,
    'medianTransactions' | 'medianFinalResourceGini' | 'medianFinalSquadGini'
  >
): SimulationCalibrationReport {
  const transferRelativeError = calibrationPrecision(
    Math.abs(simulated.medianTransactions - observed.transfers) / Math.max(1, observed.transfers)
  );
  const resourceGiniAbsoluteError = calibrationPrecision(
    Math.abs(simulated.medianFinalResourceGini - observed.finalResourceGini)
  );
  const squadGiniAbsoluteError = calibrationPrecision(
    Math.abs(simulated.medianFinalSquadGini - observed.finalSquadGini)
  );
  const strong =
    transferRelativeError <= 0.2 &&
    resourceGiniAbsoluteError <= 0.03 &&
    squadGiniAbsoluteError <= 0.03;
  const acceptable =
    transferRelativeError <= 0.4 &&
    resourceGiniAbsoluteError <= 0.06 &&
    squadGiniAbsoluteError <= 0.06;

  return {
    observedTransfers: observed.transfers,
    simulatedMedianTransactions: simulated.medianTransactions,
    transferRelativeError,
    observedFinalResourceGini: observed.finalResourceGini,
    simulatedFinalResourceGini: simulated.medianFinalResourceGini,
    resourceGiniAbsoluteError,
    observedFinalSquadGini: observed.finalSquadGini,
    simulatedFinalSquadGini: simulated.medianFinalSquadGini,
    squadGiniAbsoluteError,
    status: strong ? 'strong' : acceptable ? 'acceptable' : 'weak',
  };
}

export function buildSeasonSimulationDataset(
  source: HistoricalSimulationSource
): SeasonSimulationDataset {
  const roundDates = new Map<number, string>();
  source.userRounds.forEach((row) => {
    if (!row.participated || !row.round_date) return;
    const current = roundDates.get(Number(row.round_id));
    const day = dayOf(row.round_date);
    if (!current || day < current) roundDates.set(Number(row.round_id), day);
  });
  const rounds = Array.from(roundDates.keys()).sort((left, right) => left - right);
  const roundIndex = new Map(rounds.map((roundId, index) => [roundId, index]));
  const pointsByPlayer = new Map<number, number[]>();
  const positions = new Map<number, string>();
  source.playerStats.forEach((row) => {
    const index = roundIndex.get(Number(row.round_id));
    if (index == null) return;
    const playerId = Number(row.player_id);
    const points = pointsByPlayer.get(playerId) || Array(rounds.length).fill(0);
    points[index] = Number(row.fantasy_points) || 0;
    pointsByPlayer.set(playerId, points);
    if (row.position) positions.set(playerId, row.position);
  });

  const pricesByPlayer = new Map<number, Array<{ day: string; price: number }>>();
  source.marketValues.forEach((row) => {
    const playerId = Number(row.player_id);
    const rows = pricesByPlayer.get(playerId) || [];
    rows.push({ day: dayOf(row.date), price: Number(row.price) });
    pricesByPlayer.set(playerId, rows);
  });
  pricesByPlayer.forEach((rows) => rows.sort((left, right) => left.day.localeCompare(right.day)));
  const initialPrices = new Map<number, number>();
  source.initialSquads.forEach((row) => {
    const playerId = Number(row.player_id);
    if (!initialPrices.has(playerId)) initialPrices.set(playerId, Number(row.price));
  });

  const playerIds = new Set<number>([
    ...Array.from(pointsByPlayer.keys()),
    ...Array.from(pricesByPlayer.keys()),
    ...Array.from(initialPrices.keys()),
  ]);
  const players = Array.from(playerIds)
    .map((playerId) => {
      const priceRows = pricesByPlayer.get(playerId) || [];
      let latestPrice = initialPrices.get(playerId) || priceRows[0]?.price || 0;
      const roundPrices = rounds.map((roundId) => {
        const day = roundDates.get(roundId) || '';
        priceRows.forEach((row) => {
          if (row.day <= day) latestPrice = row.price;
        });
        return latestPrice;
      });
      const initialPrice =
        roundPrices[0] || initialPrices.get(playerId) || priceRows[0]?.price || 0;
      const priceChanges = roundPrices.map((price, index) => {
        if (index === 0 || roundPrices[index - 1] <= 0) return 0;
        return Number(Math.max(-0.3, Math.min(0.3, price / roundPrices[index - 1] - 1)).toFixed(6));
      });
      return {
        id: String(playerId),
        position: positions.get(playerId) || 'unknown',
        initialPrice,
        roundPoints: pointsByPlayer.get(playerId) || Array(rounds.length).fill(0),
        priceChanges,
        initiallyEligible: initialPrices.has(playerId),
      };
    })
    .filter(
      (player) =>
        player.initialPrice > 0 && player.roundPoints.some((points) => Number.isFinite(points))
    );

  const lineupCounts = new Map<string, number>();
  const lineupPositions = new Map<string, Map<string, number>>();
  source.lineups.forEach((row) => {
    const key = `${row.user_id}:${row.round_id}`;
    lineupCounts.set(key, (lineupCounts.get(key) || 0) + 1);
    const position = positions.get(Number(row.player_id));
    if (!position) return;
    const counts = lineupPositions.get(key) || new Map<string, number>();
    counts.set(position, (counts.get(position) || 0) + 1);
    lineupPositions.set(key, counts);
  });
  const positionNames = new Set(
    Array.from(lineupPositions.values()).flatMap((counts) => Array.from(counts.keys()))
  );
  const lineupPositionTargets = Object.fromEntries(
    Array.from(positionNames)
      .sort()
      .map((position) => [
        position,
        median(
          Array.from(lineupCounts.keys()).map(
            (lineupKey) => lineupPositions.get(lineupKey)?.get(position) || 0
          )
        ),
      ])
      .filter(([, count]) => Number(count) > 0)
  );
  const userCount = Math.max(1, source.users.length);

  return {
    startingBudget: 40_000_000,
    userCount,
    initialRosterSize: Math.max(1, Math.round(source.initialSquads.length / userCount)),
    lineupSize: Math.max(1, median(Array.from(lineupCounts.values())) || 10),
    lineupPositionTargets,
    marketDaysPerRound: 5,
    rounds,
    players,
  };
}
