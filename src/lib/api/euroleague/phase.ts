export type OfficialPhase = 'RS' | 'PI' | 'PO' | 'FF';

// Schedule `round` -> accepted schedule `group` values, as published by the advanced API (E2022-E2025).
const PHASE_GROUPS: Record<OfficialPhase, RegExp> = {
  RS: /^Regular Season$/,
  PI: /^[ABC]$/,
  PO: /^PLAYOFF [ABCD]$/,
  FF: /^(SEMIFINAL [AB]|THIRD PLACE GAME|CHAMPIONSHIP GAME)$/,
};

/** Classifies an official schedule game; throws on codes the bracket logic does not know. */
export function parseOfficialPhase(
  roundCode: string | null | undefined,
  group: string | null | undefined
): OfficialPhase {
  const phase = roundCode?.trim().toUpperCase();
  const name = group?.trim() ?? '';
  if (
    phase &&
    Object.hasOwn(PHASE_GROUPS, phase) &&
    PHASE_GROUPS[phase as OfficialPhase].test(name)
  ) {
    return phase as OfficialPhase;
  }
  throw new Error(`Unknown EuroLeague phase: round "${roundCode ?? ''}", group "${group ?? ''}".`);
}
