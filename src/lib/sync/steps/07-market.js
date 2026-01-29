import { biwengerFetch } from '../../api/biwenger-client.js';
import { CONFIG } from '../../config.js';
import { prepareMarketMutations } from '../../db/mutations/market.js';

/**
 * Syncs board history (transfers, porras, etc.) incrementally.
 * @param {import('../manager').SyncManager} manager
 * @param {Object} playersList - Map of player IDs to player objects (optional override)
 * @param {Object} teams - Map of team IDs to team objects (optional override)
 */
export async function run(manager, playersListInput, teamsInput) {
  const db = manager.context.db;
  // Use inputs if provided (legacy/compat), otherwise default to context
  const playersList = playersListInput || manager.context.playersList || {};
  const teams = teamsInput || manager.context.teams || {};

  manager.log('\n📥 Fetching Full Board History...');

  // Initialize Mutations
  const mutations = prepareMarketMutations(db);

  manager.log('Fetching full board history...');

  let offset = 0;
  const limit = 50;
  let moreTransfers = true;
  let totalTransfers = 0;
  let totalPorras = 0;
  let totalFinances = 0;

  // Helper to get league ID for raw fetch
  const leagueId = CONFIG.API.LEAGUE_ID;
  if (!leagueId) {
    throw new Error('BIWENGER_LEAGUE_ID is not defined in .env');
  }

  while (moreTransfers) {
    manager.log(`Fetching batch (offset: ${offset})...`);
    // Fetch WITHOUT type filter to get everything (transfers, market, movements, bettingPool)
    const response = await biwengerFetch(
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
    const cutoffDate = manager.context.isDaily
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      : new Date(0); // Beginning of time

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

      // Handle Betting Pool (Porras) - REMOVED: Now handled in step 13-porras.js
      if (t.type === 'bettingPool') {
        continue;
      }

      // Handle Transfers
      if (!Array.isArray(t.content)) continue;

      for (const content of t.content) {
        const timestamp = t.date;
        const date = new Date(timestamp * 1000).toISOString();
        const playerId = content.player;

        // Check if player exists, if not skip
        if (!playersList[playerId]) {
          continue;
        }

        // Determine From/To names safely
        let fromName = 'Mercado';
        let toName = 'Mercado';

        if (content.from) fromName = content.from.name;
        if (content.to) toName = content.to.name;

        // FILTER 1: Skip Mercado -> Mercado (Redundant)
        if (fromName === 'Mercado' && toName === 'Mercado') continue;

        // FILTER 2: Skip Real Teams
        const teamNames = new Set(Object.values(teams).map((t) => t.name));
        if (teamNames.has(fromName) || teamNames.has(toName)) continue;

        const result = await mutations.insertTransfer({
          timestamp: timestamp,
          fecha: date,
          player_id: playerId,
          precio: content.amount || 0,
          vendedor: fromName,
          comprador: toName,
        });

        // If transfer was inserted (not ignored), insert bids
        if (result.created && content.bids && Array.isArray(content.bids)) {
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

    if (reachedCutoff && manager.context.isDaily) {
      manager.log('   🛑 Reached cutoff date (Daily Mode). Stopping history fetch.');
      moreTransfers = false;
    } else if (items.length < limit) {
      moreTransfers = false;
    } else {
      offset += limit;
    }
  }

  return {
    success: true,
    message: `Board synced (${totalTransfers} transfers, ${totalPorras} porras, ${totalFinances} finances).`,
  };
}

// Legacy export
export const syncBoard = async (db, playersList, teams) => {
  const mockManager = {
    context: { db, playersList: playersList || {}, teams: teams || {} },
    log: console.log,
    error: console.error,
  };
  return run(mockManager, playersList, teams);
};
