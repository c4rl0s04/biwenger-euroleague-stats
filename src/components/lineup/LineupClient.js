'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { PageHeader } from '@/components/ui';
import LineupControlBar from './LineupControlBar';
import LineupCourtSection from './LineupCourtSection';
import LineupBenchSection from './LineupBenchSection';
import LineupTacticsModal from './LineupTacticsModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map a raw Biwenger lineup object into a normalized config */
function normalizeLineupConfig(lineup = {}) {
  let captainId = lineup.captain;
  if (captainId && typeof captainId === 'object') captainId = captainId.id;
  return {
    playersID: lineup.playersID || [],
    reservesID: lineup.reservesID || [],
    captain: captainId || null,
    type: lineup.type || '5-0-0',
  };
}

/** Derive starters and bench player objects from IDs + squad */
function deriveRotation(lineupConfig, squad) {
  const safeSquad = Array.isArray(squad) ? squad : [];
  const getById = (id) => safeSquad.find((p) => p && String(p.id) === String(id));

  const allIds = Array.isArray(lineupConfig.playersID) ? lineupConfig.playersID : [];
  const reserveIds = Array.isArray(lineupConfig.reservesID) ? lineupConfig.reservesID : [];

  const starterIds = allIds.slice(0, 5);
  const benchIds = [...allIds.slice(5), ...reserveIds];

  const starters = starterIds
    .map((id) => {
      const p = getById(id);
      return p ? { ...p, is_captain: String(id) === String(lineupConfig.captain) } : null;
    })
    .filter(Boolean);

  const bench = benchIds.map((id) => getById(id)).filter(Boolean);

  return { starters, bench };
}

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
    type: '5-0-0',
  });

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

        if (squadRes.success && squadRes.data) {
          setSquad(squadRes.data.players || []);
        }

        if (lineupRes.success && lineupRes.data) {
          setLineupConfig(normalizeLineupConfig(lineupRes.data.lineup));
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Alineación Predeterminada"
        description="Configura tu equipo para las próximas jornadas"
      />

      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-12 pb-24">
        {/* Action Controls */}
        <div className="flex justify-center pt-2">
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
            onPlayerClick={(p) => console.log('Starter clicked:', p)}
          />

          <LineupBenchSection
            benchPlayers={bench}
            onPlayerClick={(p) => console.log('Bench clicked:', p)}
          />
        </div>
      </div>

      <LineupTacticsModal
        isOpen={isTacticsOpen}
        onClose={() => setIsTacticsOpen(false)}
        currentType={lineupConfig.type}
        onSelect={(newType) => setLineupConfig((prev) => ({ ...prev, type: newType }))}
      />
    </div>
  );
}
