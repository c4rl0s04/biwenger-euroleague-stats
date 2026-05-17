'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import LineupControlBar from './LineupControlBar';
import LineupCourtSection from './LineupCourtSection';
import LineupBenchSection from './LineupBenchSection';
import LineupTacticsModal from './LineupTacticsModal';
import LineupPlayerSwapModal from './LineupPlayerSwapModal';
import LineupSquadAnalysis from './LineupSquadAnalysis';
import LineupSellModal from './LineupSellModal';
import LineupOffersSection from './LineupOffersSection';
import LineupOfferModal from './LineupOfferModal';
import LineupPutAllOnMarketModal from './LineupPutAllOnMarketModal';
import { PageHeader } from '@/components/ui';
import { LayoutGrid, HandCoins, TrendingUp } from 'lucide-react';
import { Section } from '@/components/layout';
import {
  realignTactics,
  normalizeLineupConfig,
  deriveRotation,
  performSwap,
} from '@/lib/utils/lineup-logic';

// ─── Component ───────────────────────────────────────────────────────────────

export default function LineupClient({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [squad, setSquad] = useState([]);
  const [lineupConfig, setLineupConfig] = useState({
    playersID: [],
    reservesID: [],
    captain: null,
    type: '2-2-1',
  });

  // ── Swap State ──────────────────────────────────────────────────────────
  const [swapTarget, setSwapTarget] = useState(null); // { player, isStarter }
  const [isSwapOpen, setIsSwapOpen] = useState(false);

  const [sellTarget, setSellTarget] = useState(null);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isBulkSellOpen, setIsBulkSellOpen] = useState(false);

  // ── Offer Management States ─────────────────────────────────────────────
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerTarget, setOfferTarget] = useState(null);
  const [offerActionType, setOfferActionType] = useState('accept'); // 'accept' or 'reject'

  // ── Data Loading ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [squadRes, lineupRes] = await Promise.all([
          apiClient.get(`/api/player/squad?userId=${userId}`).catch(() => ({ success: false })),
          apiClient.get(`/api/users/lineup?userId=${userId}`).catch(() => ({ success: false })),
        ]);

        let onSaleIds = new Set();
        let listingPrices = new Map();
        let playerOffers = new Map();
        let purchaseMap = new Map(); // Map<playerId, OwnerObject>

        if (lineupRes.success && lineupRes.data) {
          setLineupConfig(normalizeLineupConfig(lineupRes.data.lineup));

          // Extract players currently on sale and pending offers
          const marketListings = lineupRes.data.market || [];
          const offersListings = lineupRes.data.offers || [];
          const biwengerPlayers = lineupRes.data.players || [];

          // Map purchase prices from Biwenger
          biwengerPlayers.forEach((p) => {
            if (p.id && p.owner) purchaseMap.set(String(p.id), p.owner);
          });

          marketListings.forEach((m) => {
            const id = m.playerID || m.player?.id || m.id;
            if (id) {
              onSaleIds.add(String(id));
              if (m.price) listingPrices.set(String(id), m.price);
            }
          });

          offersListings.forEach((o) => {
            if (Array.isArray(o.requestedPlayers)) {
              o.requestedPlayers.forEach((id) => {
                const pid = String(id);
                onSaleIds.add(pid);

                // Group offers by player
                if (!playerOffers.has(pid)) playerOffers.set(pid, []);
                playerOffers.get(pid).push(o);
              });
            }
          });
        }

        if (squadRes.success && squadRes.data) {
          const enrichedPlayers = (squadRes.data.players || []).map((p) => ({
            ...p,
            isOnSale: onSaleIds.has(String(p.id)),
            listingPrice: listingPrices.get(String(p.id)) || null,
            offers: playerOffers.get(String(p.id)) || [],
            owner: purchaseMap.get(String(p.id)) || null, // Inject Biwenger ownership data
          }));
          setSquad(enrichedPlayers);
        }
      } catch (err) {
        console.error('Error loading lineup data:', err);
        setError('No se pudo cargar la información de tu equipo.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleWithdrawConfirm = async (player) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await apiClient.withdrawPlayer(player.id);

      if (res.success) {
        setSuccess(true);
        // Update local state immediately so the button changes back to "Vender"
        setSquad((prev) =>
          prev.map((p) => (p.id === player.id ? { ...p, isOnSale: false, listingPrice: null } : p))
        );
        setTimeout(() => setSuccess(false), 3000);
        setTimeout(() => setIsSellOpen(false), 1500);
      } else {
        throw new Error(res.message || 'Error al retirar de la venta');
      }
    } catch (err) {
      console.error('Error withdrawing from market:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = (player, offer) => {
    setOfferTarget({ player, offer });
    setOfferActionType('accept');
    setIsOfferOpen(true);
  };

  const handleRejectOffer = (player, offer) => {
    setOfferTarget({ player, offer });
    setOfferActionType('reject');
    setIsOfferOpen(true);
  };

  const handleOfferConfirm = async (player, offer) => {
    try {
      setLoading(true);
      setError(null);

      const isAccept = offerActionType === 'accept';

      // Real API Logic
      const res = isAccept
        ? await apiClient.acceptOffer(offer.id)
        : await apiClient.rejectOffer(offer.id);

      if (res.success) {
        if (isAccept) {
          setSquad((prev) => prev.filter((p) => p.id !== player.id));
        } else {
          setSquad((prev) =>
            prev.map((p) =>
              p.id === player.id
                ? { ...p, offers: (p.offers || []).filter((o) => o.id !== offer.id) }
                : p
            )
          );
        }
      } else {
        throw new Error(res.message || `Error al ${isAccept ? 'aceptar' : 'rechazar'} la oferta`);
      }
    } catch (err) {
      console.error(`Error processing offer ${offerActionType}:`, err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
      setIsOfferOpen(false);
      setOfferTarget(null);
    }
  };

  const handlePlayerClick = (player, forceStarter = null) => {
    // Detect if player is currently in the starting 5
    const isActuallyStarter =
      forceStarter !== null
        ? forceStarter
        : lineupConfig.playersID.slice(0, 5).includes(String(player.id));

    setSwapTarget({ player, isStarter: isActuallyStarter });
    setIsSwapOpen(true);
  };

  const handlePlayerSelect = (newPlayer) => {
    if (!swapTarget) return;

    const updatedLineup = performSwap(swapTarget.player.id, newPlayer.id, lineupConfig);
    setLineupConfig(updatedLineup);
    setIsSwapOpen(false);
    setSwapTarget(null);
  };

  const handleSetCaptain = (playerId) => {
    setLineupConfig((prev) => ({
      ...prev,
      captain: prev.captain === Number(playerId) ? null : Number(playerId),
    }));
  };

  const handleSellClick = (player) => {
    setSellTarget(player);
    setIsSellOpen(true);
  };

  const handleSellConfirm = async (player, price, actionType = 'vender') => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const isImmediate = actionType === 'inmediata';
      const apiType = isImmediate ? 'immediateSell' : 'sell';
      const apiPrice = isImmediate ? player.price : price;

      const res = await apiClient.sellPlayer({
        playerId: player.id,
        price: apiPrice,
        type: apiType,
      });

      if (res.success) {
        setSuccess(true);
        // If immediate sell, remove player from the squad locally
        if (isImmediate) {
          setSquad((prev) => prev.filter((p) => p.id !== player.id));
        } else {
          // Update local state immediately so the button changes to "En Venta"
          setSquad((prev) =>
            prev.map((p) =>
              p.id === player.id ? { ...p, isOnSale: true, listingPrice: apiPrice } : p
            )
          );
        }
        setTimeout(() => setSuccess(false), 3000);
        setTimeout(() => setIsSellOpen(false), 1500);
      } else {
        throw new Error(res.message || 'Error al poner en venta');
      }
    } catch (err) {
      console.error('Error selling player:', err);
      setError(err.message || 'Error al conectar con Biwenger');
    } finally {
      setLoading(false);
      setIsSellOpen(false);
      setSellTarget(null);
    }
  };

  // ── Save Handler ────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await apiClient.saveLineup({ userId, ...lineupConfig });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(res.message || 'Error al guardar');
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con Biwenger');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived State ───────────────────────────────────────────────────────
  const { starters, bench } = deriveRotation(lineupConfig, squad);
  const captainName = starters.find((p) => p.is_captain)?.name;

  // ── Loading State ───────────────────────────────────────────────────────
  if (loading && squad.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Cargando tu equipo...</p>
      </div>
    );
  }

  const handlePutAllOnMarket = () => {
    setIsBulkSellOpen(true);
  };

  const confirmBulkSell = async (percentage) => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.post('/api/market/sell-all', { pricePercentage: percentage });
      if (res.success) {
        setSuccess(`¡Plantilla entera puesta en el mercado al ${percentage}%!`);
        setIsBulkSellOpen(false);
        // Local state update so buttons change instantly
        setSquad((prev) =>
          prev.map((p) => ({
            ...p,
            isOnSale: true,
            listingPrice: p.price * (percentage / 100),
          }))
        );
      } else {
        setError(res.error || 'Error al enviar plantilla al mercado');
      }
    } catch (err) {
      setError('Error de conexión al alinear mercado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Alineación" description="Configura tu equipo para las próximas jornadas" />

      <div className="space-y-12">
        {/* Main Lineup Visualization */}
        <Section title="Tu Alineación" delay={100} background="section-base">
          <div className="max-w-5xl mx-auto space-y-2">
            {/* Action Controls */}
            <div className="flex justify-center">
              <LineupControlBar
                loading={loading}
                error={error}
                success={success}
                currentType={lineupConfig.type}
                onSave={handleSave}
                onReset={() => window.location.reload()}
                onChangeType={() => setIsTacticsOpen(true)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              <LineupCourtSection
                starters={starters}
                captainName={captainName}
                onPlayerClick={(p) => handlePlayerClick(p, true)}
              />

              <LineupBenchSection
                benchPlayers={bench}
                onPlayerClick={(p) => handlePlayerClick(p, false)}
              />
            </div>
          </div>
        </Section>

        <Section title="Centro de Fichajes" delay={150} background="section-base">
          <LineupOffersSection
            squad={squad}
            onAccept={handleAcceptOffer}
            onReject={handleRejectOffer}
            onPutAllOnMarket={handlePutAllOnMarket}
            loading={loading}
          />
        </Section>

        {/* Squad Analysis Section */}
        <Section title="Mercado y Plantilla" delay={200} background="section-raised">
          <LineupSquadAnalysis
            squad={squad}
            onPlayerClick={(p) => handlePlayerClick(p)}
            onSellClick={handleSellClick}
          />
        </Section>
      </div>

      <LineupSellModal
        key={`${sellTarget?.id}-${isSellOpen}`}
        isOpen={isSellOpen}
        onClose={() => setIsSellOpen(false)}
        player={sellTarget}
        onConfirm={handleSellConfirm}
        onWithdraw={handleWithdrawConfirm}
      />

      <LineupTacticsModal
        isOpen={isTacticsOpen}
        onClose={() => setIsTacticsOpen(false)}
        currentType={lineupConfig.type}
        onSelect={(newType) => {
          const updatedLineup = realignTactics(newType, squad, lineupConfig);
          setLineupConfig((prev) => ({
            ...prev,
            type: newType,
            playersID: updatedLineup.playersID,
            reservesID: updatedLineup.reservesID,
          }));
        }}
      />

      <LineupPlayerSwapModal
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        targetPlayer={swapTarget?.player}
        isStarter={swapTarget?.isStarter}
        squad={squad}
        activeIds={new Set(lineupConfig.playersID)}
        onSelect={handlePlayerSelect}
        captainId={lineupConfig.captain}
        onSetCaptain={handleSetCaptain}
      />

      <LineupOfferModal
        isOpen={isOfferOpen}
        onClose={() => {
          setIsOfferOpen(false);
          setOfferTarget(null);
        }}
        player={offerTarget?.player}
        offer={offerTarget?.offer}
        actionType={offerActionType}
        onConfirm={handleOfferConfirm}
        loading={loading}
      />

      <LineupPutAllOnMarketModal
        isOpen={isBulkSellOpen}
        onClose={() => setIsBulkSellOpen(false)}
        onConfirm={confirmBulkSell}
        loading={loading}
      />
    </div>
  );
}
