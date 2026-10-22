'use client';

import { Check, LoaderCircle, Save, Star, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useLineupWorkspace } from '../hooks/useLineupWorkspace';
import { LineupWorkspaceFeedback } from '../components/LineupWorkspaceFeedback';
import { clearLineupSlot, planReplacement } from '../logic/draft';

import { deriveRotation } from '../logic/lineup';
import { rankSwapCandidates } from '../logic/squad';

import type { LineupRotationSlot } from '../logic/lineup';
import type { LineupWorkspacePlayer } from '../models/workspace';

import MobileBottomSheet from '@/components/mobile/MobileBottomSheet';
import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '@/components/mobile/MobileScreen';

type Player = LineupWorkspacePlayer;

export default function MobileLineupClient({ userId }: { userId: string | number }) {
  const workspace = useLineupWorkspace(userId);
  const toastAnchorRef = useRef<HTMLDivElement>(null);
  const { loading, saving, squad, lineupConfig, setLineupConfig } = workspace;
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<LineupRotationSlot<Player> | null>(null);

  const rotation = useMemo(() => deriveRotation(lineupConfig, squad), [lineupConfig, squad]);

  const swapWith = (player: Player) => {
    if (!selected) return;
    const plan = planReplacement(lineupConfig, selected.slotIndex, player.id, squad);
    if (!plan.ok) {
      workspace.setError(plan.reason);
      return;
    }
    setLineupConfig(plan.lineup);
    setSelected(null);
  };

  const setCaptain = () => {
    const player = selected?.player;
    if (!player) return;
    setLineupConfig((current) => ({ ...current, captain: player.id }));
    setSelected(null);
  };

  const save = workspace.save;

  const candidates = selected
    ? rankSwapCandidates(
        squad,
        { id: selected.playerId, position: selected.position },
        false,
        new Set((lineupConfig.playersID ?? []).filter((id) => id !== null).map(String))
      ).sort(
        (a, b) =>
          Number(b.position === selected.position) - Number(a.position === selected.position)
      )
    : [];

  if (loading && !workspace.checkedAt)
    return (
      <div className="mobile-lineup-loading">
        <LoaderCircle className="animate-spin" aria-hidden="true" /> Cargando alineación
      </div>
    );

  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-has-sticky-action">
      <MobileScreenHeader eyebrow="Tu equipo" title="Alineación" />
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          disabled={loading || saving}
          onClick={workspace.refresh}
          className="cursor-pointer underline disabled:opacity-50"
        >
          Actualizar plantilla
        </button>
        {workspace.dirty && (
          <span className="text-xs text-content-secondary">Cambios sin guardar</span>
        )}
      </div>
      <LineupWorkspaceFeedback workspace={workspace} toastAnchorRef={toastAnchorRef} />
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
      <div ref={toastAnchorRef} className="mobile-sticky-action-bar">
        <button
          type="button"
          className="mobile-primary-action mobile-save-lineup"
          onClick={save}
          disabled={!workspace.canSave}
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
            {selected.playerId !== null && (
              <button
                type="button"
                onClick={() => {
                  setLineupConfig(clearLineupSlot(lineupConfig, selected.slotIndex));
                  setSelected(null);
                }}
              >
                Dejar posición vacía
              </button>
            )}
            <p>Cambiar por</p>
            {candidates.map((player) => {
              const plan = planReplacement(lineupConfig, selected.slotIndex, player.id, squad);
              return (
                <button
                  key={String(player.id)}
                  type="button"
                  disabled={!plan.ok}
                  onClick={() => swapWith(player)}
                  className="mobile-lineup-swap"
                >
                  <span>{player.name}</span>
                  <small>
                    {!plan.ok
                      ? plan.reason
                      : plan.formationChanged
                        ? `Cambiar formación: ${lineupConfig.type} → ${plan.lineup.type}`
                        : (player.position ?? 'Jugador')}
                  </small>
                </button>
              );
            })}
          </div>
        )}
      </MobileBottomSheet>
    </MobileScreen>
  );
}
