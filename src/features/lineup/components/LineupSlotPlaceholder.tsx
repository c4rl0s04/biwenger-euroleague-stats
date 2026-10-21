'use client';

import { UserPlus } from 'lucide-react';
import type { LineupRotationSlot } from '../logic/lineup';

export function LineupSlotPlaceholder({
  slot,
  onSelect,
}: {
  slot: LineupRotationSlot;
  onSelect: (slot: LineupRotationSlot) => void;
}) {
  const label =
    slot.playerId !== null ? 'Jugador no disponible' : `${slot.position || 'Jugador'} vacío`;
  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      aria-label={`${label}, posición ${slot.slotIndex + 1}`}
      className="cursor-pointer flex min-h-20 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-default bg-surface-card/80 p-2 text-content-muted hover:text-action-primary focus-visible:outline-2 focus-visible:outline-action-primary"
    >
      <UserPlus size={24} aria-hidden="true" />
      <span className="text-center text-xs">{label}</span>
    </button>
  );
}
