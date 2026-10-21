import 'server-only';
import type { BiwengerProviderClient, BiwengerRequestContext } from '@/features/provider/server';
import { lineupFingerprint } from '../../logic/draft';
import { mapToSafeLineupResponse } from '../mappers/lineup-read.mapper';
import { LineupOperationError } from '../errors';
import { LINEUP_READ_FIELDS } from './lineup-read.service';

export async function readLiveLineup(
  client: BiwengerProviderClient,
  context: BiwengerRequestContext
) {
  const response = await client.query<unknown>(`/user?fields=${LINEUP_READ_FIELDS}`, {
    context,
    cache: 'no-store',
    retries: 0,
  });
  const envelope =
    response && typeof response === 'object' ? (response as { data?: unknown }) : null;
  const payload = envelope?.data ?? response;
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as { players?: unknown }).players)
  ) {
    throw new LineupOperationError(
      'LINEUP_OWNERSHIP_UNAVAILABLE',
      'Biwenger no ha devuelto una plantilla completa. Vuelve a intentarlo.',
      502
    );
  }
  const players = (payload as { players: unknown[] }).players;
  const ids = players.map((p) => (p && typeof p === 'object' ? (p as { id?: unknown }).id : null));
  if (
    ids.some((id) => !/^[1-9]\d*$/.test(String(id))) ||
    new Set(ids.map(String)).size !== ids.length
  ) {
    throw new LineupOperationError(
      'LINEUP_OWNERSHIP_UNAVAILABLE',
      'No se pudo verificar la plantilla de Biwenger.',
      502
    );
  }
  const rawLineup = (payload as { lineup?: unknown }).lineup;
  if (
    rawLineup !== null &&
    (!rawLineup ||
      typeof rawLineup !== 'object' ||
      !Array.isArray((rawLineup as { playersID?: unknown }).playersID))
  ) {
    throw new LineupOperationError(
      'LINEUP_STATE_UNAVAILABLE',
      'No se pudo verificar la alineación guardada en Biwenger.',
      502
    );
  }
  if (rawLineup && typeof rawLineup === 'object') {
    const value = rawLineup as { playersID: unknown[]; reservesID?: unknown; captain?: unknown };
    const isSlot = (id: unknown) => id === null || /^[1-9]\d*$/.test(String(id));
    const captain =
      value.captain && typeof value.captain === 'object'
        ? (value.captain as { id?: unknown }).id
        : value.captain;
    if (
      (value.captain !== null && typeof value.captain === 'object' && captain === undefined) ||
      value.playersID.length > 10 ||
      !value.playersID.every(isSlot) ||
      (value.reservesID !== undefined &&
        (!Array.isArray(value.reservesID) || !value.reservesID.every(isSlot))) ||
      (captain != null && captain !== 0 && !isSlot(captain))
    ) {
      throw new LineupOperationError(
        'LINEUP_STATE_UNAVAILABLE',
        'La alineación recibida de Biwenger no se pudo verificar.',
        502
      );
    }
  }
  const provider = mapToSafeLineupResponse(payload);
  return {
    provider,
    ownedIds: ids.map(String),
    baseline: lineupFingerprint(provider.lineup),
    checkedAt: new Date().toISOString(),
  };
}
