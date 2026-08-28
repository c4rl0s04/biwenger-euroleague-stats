import { biwengerFetch } from '../../api/biwenger-client';
import { CONFIG } from '../../config';
import { prepareMarketMutations } from '../../db/mutations/market';
import { SyncManager } from '../manager';

interface BoardDependencies {
  fetch: typeof biwengerFetch;
}

const defaultDependencies: BoardDependencies = { fetch: biwengerFetch };

/**
 * Syncs board history (transfers, porras, etc.) incrementally.
 * @param manager
 * @param playersList - Map of player IDs to player objects (optional override)
 * @param teams - Map of team IDs to team objects (optional override)
 */
export async function run(manager: SyncManager, dependencies = defaultDependencies) {
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('Canonical sync season was not resolved before board ingestion.');
  const snapshot = await manager.getBiwengerCompetition();
  const playersList = snapshot.players;
  const teams = snapshot.teams;

  manager.log('\n📥 Fetching Full Board History...');

  // Initialize Mutations
  const mutations = prepareMarketMutations(db as any, { seasonId });
  const usersResult = await (db as any).query(
    `
    SELECT COALESCE(us.name, u.name) as name
    FROM user_seasons us
    JOIN users u ON u.id = us.user_id
    WHERE us.season_id = $1
      AND COALESCE(us.status, 'active') = 'active'
      AND COALESCE(us.name, u.name) IS NOT NULL
      AND TRIM(COALESCE(us.name, u.name)) != ''
  `,
    [seasonId]
  );
  const validUserNames = new Set(
    usersResult.rows.map((row: any) => row.name).filter((name: string | null) => Boolean(name))
  );

  manager.log('Fetching full board history...');
  let offset = 0;
  const limit = 50;
  let moreTransfers = true;
  let totalTransfers = 0;
  let totalPorras = 0;
  let totalFinances = 0;
  let transfersWithMissingPlayer = 0;
  let skippedInvalidActorTransfers = 0;
  const teamNames = new Set(Object.values(teams).map((team: any) => team.name));

  // Helper to get league ID for raw fetch
  const leagueId = CONFIG.API.LEAGUE_ID;
  if (!leagueId) {
    throw new Error('BIWENGER_LEAGUE_ID is not defined in .env');
  }

  while (moreTransfers) {
    manager.log(`Fetching batch (offset: ${offset})...`);
    // Fetch WITHOUT type filter to get everything (transfers, market, movements, bettingPool)
    const response = await dependencies.fetch(
      CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(leagueId, offset, limit),
      { skipVersionCheck: true }
    );
    const items = response.data;

    if (!items || items.length === 0) {
      moreTransfers = false;
      break;
    }

    // Process Items Sequentially
    let reachedCutoff = false;
    const cutoffDate =
      manager.mode === 'routine' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : new Date(0);

    for (const t of items) {
      // Check date limit for daily optimization
      const itemDate = new Date(t.date * 1000);
      if (itemDate < cutoffDate) {
        reachedCutoff = true;
        // We can stop processing this batch if sorted desc (default),
        // but mixed content might exist, so safe to break loop?
        // Biwenger board is typically reverse chronological.
        break;
      }

      // Filter for relevant types
      if (
        ![
          'transfer',
          'market',
          'playerMovements',
          'bettingPool',
          'roundFinished',
          'adminTransfer',
        ].includes(t.type)
      )
        continue;

      // Some events might not have content or be different
      if (!t.content) continue;

      // Handle Round Bonuses (roundFinished)
      if (t.type === 'roundFinished') {
        if (t.content.results && Array.isArray(t.content.results)) {
          const roundId = t.content.round ? t.content.round.id : null;
          const roundName = t.content.round ? t.content.round.name : 'Unknown';
          const date = new Date(t.date * 1000).toISOString();

          for (const res of t.content.results) {
            if (res.bonus && res.bonus > 0) {
              try {
                await mutations.insertFinance({
                  user_id: res.user.id || res.user,
                  round_id: roundId,
                  date: date,
                  type: 'round_bonus',
                  amount: res.bonus,
                  description: `Bonus ${roundName}`,
                });
                totalFinances++;
              } catch (e) {
                // Ignore unique constraint/dup errors
              }
            }
          }
        }
        continue;
      }

      // Handle Admin Bonuses (adminTransfer)
      if (t.type === 'adminTransfer') {
        if (t.content.to && t.content.amount) {
          try {
            const date = new Date(t.date * 1000).toISOString();
            await mutations.insertFinance({
              user_id: t.content.to.id || t.content.to,
              round_id: null,
              date: date,
              type: 'admin_bonus',
              amount: t.content.amount,
              description: t.content.text || 'Abono Administración',
            });
            totalFinances++;
          } catch (e) {}
        }
        continue;
      }

      // Betting pools share the same board stream as transfers and finances.
      if (t.type === 'bettingPool') {
        const pool = t.content.pool;
        if (!pool?.responses || !Array.isArray(pool.responses)) continue;
        const sourceRound = pool.round;
        if (!sourceRound?.id) continue;
        const roundId = manager.resolveRoundId(sourceRound);
        const roundName = sourceRound.name || 'Unknown Round';
        for (const response of pool.responses) {
          const userId = response.id;
          if (!userId) continue;
          let prediction = response.response || response.result || '';
          if (Array.isArray(prediction)) prediction = prediction.join('-');
          await mutations.insertPorra({
            user_id: String(userId),
            round_id: roundId,
            round_name: roundName,
            result: String(prediction),
            aciertos: response.hits ?? response.points ?? null,
          });
          totalPorras++;
        }
        continue;
      }

      // Handle Transfers
      if (!Array.isArray(t.content)) continue;

      for (const content of t.content) {
        const timestamp = t.date;
        const date = new Date(timestamp * 1000).toISOString();
        const playerId = content.player;
        const hasResolvedPlayer = Boolean(playersList[playerId]);

        // Determine From/To names safely
        let fromName = 'Mercado';
        let toName = 'Mercado';

        if (content.from) fromName = content.from.name;
        if (content.to) toName = content.to.name;

        // FILTER 1: Skip Mercado -> Mercado (Redundant)
        if (fromName === 'Mercado' && toName === 'Mercado') continue;

        // FILTER 2: Skip Real Teams
        if (teamNames.has(fromName) || teamNames.has(toName)) continue;

        // FILTER 3: Keep only user/market interactions
        const fromIsAllowed = fromName === 'Mercado' || validUserNames.has(fromName);
        const toIsAllowed = toName === 'Mercado' || validUserNames.has(toName);
        if (!fromIsAllowed || !toIsAllowed) {
          skippedInvalidActorTransfers++;
          continue;
        }

        if (!hasResolvedPlayer) {
          transfersWithMissingPlayer++;
        }

        const result = await mutations.insertTransfer({
          timestamp: timestamp,
          fecha: date,
          player_id: playerId,
          precio: content.amount || 0,
          vendedor: fromName,
          comprador: toName,
        });

        // If transfer was inserted (not ignored), insert bids
        if (result.created && result.id && content.bids && Array.isArray(content.bids)) {
          const transferId = result.id;

          for (const bid of content.bids) {
            try {
              const bidderId = bid.user ? bid.user.id || bid.user : null;
              const bidderName = bid.user ? bid.user.name || 'Unknown' : 'Unknown';

              await mutations.insertBid({
                transfer_id: transferId,
                bidder_id: bidderId ? bidderId.toString() : null,
                bidder_name: bidderName,
                amount: bid.amount || 0,
              });
            } catch (e) {
              // Ignore bid errors
            }
          }
        }

        totalTransfers++;
      }
    }

    if (reachedCutoff && manager.mode === 'routine') {
      manager.log('   🛑 Reached the routine seven-day cutoff. Stopping history fetch.');
      moreTransfers = false;
    } else if (items.length < limit) {
      moreTransfers = false;
    } else {
      offset += limit;
    }
  }

  if (transfersWithMissingPlayer > 0) {
    manager.log(
      `   ⚠️ Inserted ${transfersWithMissingPlayer} transfers with players missing from playersList.`
    );
  }

  if (skippedInvalidActorTransfers > 0) {
    manager.log(
      `   🧹 Skipped ${skippedInvalidActorTransfers} transfers involving actors outside users/market.`
    );
  }

  return {
    summary: 'Biwenger board history synchronized in a single pagination pass.',
    counts: { transfers: totalTransfers, pools: totalPorras, finances: totalFinances },
  };
}
