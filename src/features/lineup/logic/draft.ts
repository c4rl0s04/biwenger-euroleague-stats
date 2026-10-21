import {
  normalizeLineupConfig,
  performSwap,
  type TacticalLineup,
  type TacticalPlayer,
} from './lineup';

export const FORMATIONS = [
  '2-2-1',
  '1-2-2',
  '2-1-2',
  '1-3-1',
  '3-1-1',
  '2-3-0',
  '3-2-0',
  '1-1-3',
  '2-0-3',
  '0-2-3',
  '0-3-2',
  '3-0-2',
] as const;
export const POSITIONS = ['Base', 'Alero', 'Pivot'] as const;
export function formationPositions(type: string): string[] {
  if (!(FORMATIONS as readonly string[]).includes(type)) return [];
  return type.split('-').flatMap((n, i) => Array<string>(Number(n)).fill(POSITIONS[i]));
}

export function lineupFingerprint(input: TacticalLineup | null): string {
  const lineup = normalizeLineupConfig(input);
  return JSON.stringify({
    ...lineup,
    playersID: Array.from({ length: 10 }, (_, i) => lineup.playersID[i] ?? null),
  });
}

export function clearLineupSlot(input: TacticalLineup, index: number): TacticalLineup {
  const draft = normalizeLineupConfig(input);
  if (!Number.isInteger(index) || index < 0 || index >= 10) return draft;
  const id = draft.playersID[index];
  if (id == null) return draft;
  draft.playersID[index] = null;
  if (!draft.reservesID.includes(id)) {
    const empty = draft.reservesID.indexOf(null);
    if (empty < 0) draft.reservesID.push(id);
    else draft.reservesID[empty] = id;
  }
  if (draft.captain === id) draft.captain = null;
  return draft;
}

export type ReplacementPlan =
  { ok: true; lineup: TacticalLineup; formationChanged: boolean } | { ok: false; reason: string };
export function planReplacement(
  input: TacticalLineup,
  index: number,
  newId: string | number,
  squad: TacticalPlayer[]
): ReplacementPlan {
  if (!Number.isInteger(index) || index < 0 || index >= 10)
    return { ok: false, reason: 'Selecciona una posición de la rotación.' };
  const candidate = squad.find((p) => String(p.id) === String(newId));
  if (!candidate || !POSITIONS.includes(candidate.position as (typeof POSITIONS)[number]))
    return { ok: false, reason: 'Falta la posición de este jugador. Actualiza la plantilla.' };
  const previous = normalizeLineupConfig(input);
  const next = normalizeLineupConfig(performSwap({ slotIndex: index }, newId, previous));
  // Captaincy belongs to the person, rather than the slot being replaced.
  next.captain = previous.captain;
  const starters = next.playersID.slice(0, 5).filter((id): id is string => id !== null);
  if (next.captain && !starters.includes(next.captain)) next.captain = null;
  if (index >= 5) return { ok: true, lineup: next, formationChanged: false };
  const players = starters.map((id) => squad.find((p) => String(p.id) === id));
  if (players.some((p) => !p || !POSITIONS.includes(p.position as (typeof POSITIONS)[number])))
    return {
      ok: false,
      reason: 'Faltan datos de un titular. Actualiza la plantilla antes de cambiar la formación.',
    };
  const counts = POSITIONS.map((pos) => players.filter((p) => p?.position === pos).length);
  const currentCounts = previous.type.split('-').map(Number);
  const compatible = FORMATIONS.filter((type) =>
    type.split('-').every((n, i) => Number(n) >= counts[i])
  );
  compatible.sort((a, b) => {
    const distance = (type: string) =>
      type.split('-').reduce((sum, n, i) => sum + Math.abs(Number(n) - (currentCounts[i] || 0)), 0);
    return distance(a) - distance(b);
  });
  const type = compatible.includes(previous.type as (typeof FORMATIONS)[number])
    ? previous.type
    : compatible[0];
  if (!type)
    return {
      ok: false,
      reason: 'Ninguna formación compatible permite este cambio sin sustituir a otro titular.',
    };
  const positions = formationPositions(type);
  const available = [...starters];
  const ordered = positions.map((pos, i) => {
    const id = next.playersID[i];
    if (id !== null && squad.find((p) => String(p.id) === id)?.position === pos) {
      available.splice(available.indexOf(id), 1);
      return id;
    }
    return null;
  });
  for (let i = 0; i < 5; i++) {
    if (ordered[i] !== null) continue;
    // Keep intentional gaps when the current slots already match the formation.
    if (
      type === previous.type &&
      next.playersID.every(
        (id, at) =>
          at >= 5 ||
          id === null ||
          squad.find((p) => String(p.id) === id)?.position === positions[at]
      )
    )
      continue;
    const at = available.findIndex(
      (id) => squad.find((p) => String(p.id) === id)?.position === positions[i]
    );
    if (at >= 0) ordered[i] = available.splice(at, 1)[0];
  }
  next.playersID = [
    ...ordered,
    ...Array.from({ length: 5 }, (_, i) => next.playersID[i + 5] ?? null),
  ];
  next.type = type;
  return { ok: true, lineup: next, formationChanged: type !== previous.type };
}
