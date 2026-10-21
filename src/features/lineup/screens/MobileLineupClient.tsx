'use client';

import { Check, LoaderCircle, Save, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { deriveRotation, normalizeLineupConfig, performSwap } from '../logic/lineup';
import { rankSwapCandidates } from '../logic/squad';

import type { ManagerSquadPlayerViewModel } from '@/features/managers/public';
import type { LineupRotationSlot, TacticalLineup } from '../logic/lineup';

import MobileBottomSheet from '@/components/mobile/MobileBottomSheet';
import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '@/components/mobile/MobileScreen';

type Player = Pick<ManagerSquadPlayerViewModel, 'id' | 'name' | 'position'> & {
  team_name?: string;
};

export default function MobileLineupClient({ userId }: { userId: string | number }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [squad, setSquad] = useState<Player[]>([]);
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<LineupRotationSlot<Player> | null>(null);
  const [lineupConfig, setLineupConfig] = useState<TacticalLineup>({
    playersID: [],
    reservesID: [],
    captain: null,
    type: '2-2-1',
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.get(`/api/player/squad?userId=${userId}`),
      apiClient.get('/api/users/lineup'),
    ])
      .then(([squadResponse, lineupResponse]) => {
        if (!active) return;
        if (squadResponse.success) setSquad(squadResponse.data?.players ?? []);
        if (lineupResponse.success)
          setLineupConfig(normalizeLineupConfig(lineupResponse.data?.lineup));
      })
      .catch(() => active && setMessage('No se pudo cargar tu alineación.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const rotation = useMemo(() => deriveRotation(lineupConfig, squad), [lineupConfig, squad]);

  const swapWith = (player: Player) => {
    if (!selected) return;
    setLineupConfig((current) =>
      performSwap({ slotIndex: selected.slotIndex }, player.id, current)
    );
    setSelected(null);
  };

  const setCaptain = () => {
    const player = selected?.player;
    if (!player) return;
    setLineupConfig((current) => ({ ...current, captain: player.id }));
    setSelected(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const result = await apiClient.saveLineup(lineupConfig);
      setMessage(
        result.success ? 'Alineación guardada.' : (result.message ?? 'No se pudo guardar.')
      );
    } catch {
      setMessage('No se pudo guardar la alineación.');
    } finally {
      setSaving(false);
    }
  };

  const candidates = selected
    ? rankSwapCandidates(
        squad,
        { id: selected.playerId, position: selected.position },
        selected.slotIndex < 5,
        new Set((lineupConfig.playersID ?? []).filter((id) => id !== null).map(String))
      )
    : [];

  if (loading)
    return (
      <div className="mobile-lineup-loading">
        <LoaderCircle className="animate-spin" aria-hidden="true" /> Cargando alineación
      </div>
    );

  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-has-sticky-action">
      <MobileScreenHeader eyebrow="Tu equipo" title="Alineación" />
      {message && (
        <p className="mobile-lineup-message" role="status">
          {message}
        </p>
      )}
      <MobileSectionHeading>Quinteto</MobileSectionHeading>
      <div className="mobile-lineup-court" aria-label="Quinteto titular">
        {rotation.starters.map((slot, index: number) => (
          <button
            key={slot.slotIndex}
            data-slot-index={slot.slotIndex}
            type="button"
            onClick={(event) => {
              returnFocusRef.current = event.currentTarget;
              setSelected(slot);
            }}
            className={`mobile-lineup-player mobile-lineup-slot-${index + 1}`}
          >
            {slot.player?.is_captain && <Star size={14} aria-label="Capitán" />}
            <strong>
              {slot.player?.name ??
                (slot.playerId !== null
                  ? 'Jugador no disponible'
                  : `${slot.position || 'Jugador'} vacío`)}
            </strong>
            <span>{slot.position}</span>
          </button>
        ))}
      </div>
      <MobileSectionHeading>Banquillo</MobileSectionHeading>
      <div className="mobile-lineup-bench">
        {rotation.bench.map((slot) => (
          <button
            key={slot.slotIndex}
            data-slot-index={slot.slotIndex}
            type="button"
            onClick={(event) => {
              returnFocusRef.current = event.currentTarget;
              setSelected(slot);
            }}
          >
            <strong>
              {slot.player?.name ??
                (slot.playerId !== null ? 'Jugador no disponible' : 'Jugador vacío')}
            </strong>
            <span>{slot.slotIndex === 5 ? 'Sexto hombre' : (slot.position ?? 'Suplente')}</span>
          </button>
        ))}
      </div>
      <MobileSectionHeading>Gestión</MobileSectionHeading>
      <div>
        <MobileSectionLink
          href="/lineup/squad"
          title="Plantilla"
          description="Valor, forma y situación de cada jugador"
          icon={Users}
          accent="green"
        />
        <MobileSectionLink
          href="/lineup/offers"
          title="Ofertas"
          description="Revisar y responder propuestas"
          icon={Check}
        />
        <MobileSectionLink
          href="/lineup/analysis"
          title="Análisis"
          description="Equilibrio y alternativas del quinteto"
          icon={Star}
          accent="violet"
        />
      </div>
      <div className="mobile-sticky-action-bar">
        <button
          type="button"
          className="mobile-primary-action mobile-save-lineup"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Save size={18} aria-hidden="true" />
          )}{' '}
          Guardar alineación
        </button>
      </div>
      <MobileBottomSheet
        open={Boolean(selected)}
        returnFocusRef={returnFocusRef}
        onClose={() => setSelected(null)}
        title={
          selected?.player?.name ??
          (selected?.playerId != null
            ? 'Jugador no disponible'
            : `${selected?.position || 'Jugador'} vacío`)
        }
        description="Cambia su posición o asígnale la capitanía"
      >
        {selected && (
          <div className="mobile-lineup-actions">
            {selected.slotIndex < 5 && selected.player !== null && (
              <button type="button" className="mobile-primary-action" onClick={setCaptain}>
                <Star size={18} aria-hidden="true" /> Hacer capitán
              </button>
            )}
            <p>Cambiar por</p>
            {candidates.map((player: Player) => (
              <button
                key={String(player.id)}
                type="button"
                onClick={() => swapWith(player)}
                className="mobile-lineup-swap"
              >
                <span>{player.name}</span>
                <small>{player.position ?? 'Jugador'}</small>
              </button>
            ))}
          </div>
        )}
      </MobileBottomSheet>
    </MobileScreen>
  );
}
