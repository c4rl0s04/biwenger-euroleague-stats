import 'server-only';
import {
  executeUserProviderCommand,
  BiwengerNetworkError,
  BiwengerProviderError,
} from '@/features/provider/server';
import type { LineupCommandResult } from '../../models/lineup';
import { validateLineupCommand } from '../../validation/lineup-command.schema';
import { formationPositions } from '../../logic/draft';
import { readLiveLineup } from './lineup-live.service';
import { readWorkspacePlayers } from '../queries/workspace.query';
import { LineupOperationError } from '../errors';

export interface LineupCommandService {
  updateLineup(userId: string, input: unknown, baseline?: string): Promise<LineupCommandResult>;
}
export const lineupCommandService: LineupCommandService = {
  async updateLineup(userId, input, baseline) {
    if (!userId) throw new Error('User ID is required to update lineup');
    const lineup = validateLineupCommand(input);
    await executeUserProviderCommand(userId, 'lineup.update', async (client, context) => {
      const live = await readLiveLineup(client, context);
      const ids = [...lineup.playersID, ...(lineup.reservesID || [])]
        .filter((id) => id !== null)
        .map(String);
      const owned = new Set(live.ownedIds);
      const invalid = Array.from(new Set(ids.filter((id) => !owned.has(id))));
      if (invalid.length)
        throw new LineupOperationError(
          'LINEUP_ROSTER_CHANGED',
          'Tu plantilla ha cambiado en Biwenger. Hay jugadores que ya no pertenecen a tu equipo. Actualiza la plantilla y revisa los cambios.',
          409,
          {
            invalidPlayerIds: invalid,
            affectedSlotIndexes: lineup.playersID.flatMap((id, index) =>
              id !== null && invalid.includes(String(id)) ? [index] : []
            ),
          }
        );
      if (baseline !== undefined && baseline !== live.baseline)
        throw new LineupOperationError(
          'LINEUP_CHANGED_ELSEWHERE',
          'Tu alineación ha cambiado en Biwenger. Carga la última versión o revisa tus cambios antes de guardarlos.',
          409
        );
      const positions = formationPositions(lineup.type || '2-2-1');
      if (!positions.length || ids.length !== new Set(ids).size)
        throw new LineupOperationError(
          'LINEUP_INVALID_SELECTION',
          'Revisa la formación y los jugadores duplicados.',
          422
        );
      if (!lineup.playersID.some((id) => id !== null))
        throw new LineupOperationError(
          'LINEUP_INVALID_SELECTION',
          'Selecciona al menos un jugador antes de guardar.',
          422
        );
      if (
        lineup.captain != null &&
        !lineup.playersID
          .slice(0, 5)
          .some((id) => id !== null && String(id) === String(lineup.captain))
      )
        throw new LineupOperationError(
          'LINEUP_INVALID_CAPTAIN',
          'El capitán debe estar en el quinteto titular.',
          422
        );
      const players = await readWorkspacePlayers(
        lineup.playersID
          .slice(0, 5)
          .filter((id) => id !== null)
          .map(String)
      );
      for (let i = 0; i < Math.min(5, lineup.playersID.length); i++) {
        const id = lineup.playersID[i];
        if (id === null) continue;
        const player = players.find((p) => String(p.id) === String(id));
        if (!player?.position)
          throw new LineupOperationError(
            'LINEUP_PLAYER_DETAILS_MISSING',
            'Falta la posición de un titular. Actualiza la plantilla antes de guardar.',
            422
          );
        if (player.position !== positions[i])
          throw new LineupOperationError(
            'LINEUP_INVALID_SELECTION',
            'La posición de un titular no coincide con la formación.',
            422
          );
      }
      try {
        const result = await client.command('/user', { method: 'PUT', body: { lineup }, context });
        if (result.raw !== undefined) {
          const body =
            result.raw && typeof result.raw === 'object'
              ? (result.raw as { status?: unknown; success?: unknown })
              : null;
          const confirmed =
            body &&
            (body.success === true ||
              (typeof body.status === 'number' && body.status >= 200 && body.status < 300));
          if (!confirmed)
            throw new LineupOperationError(
              'LINEUP_SAVE_UNCONFIRMED',
              'Biwenger devolvió una respuesta que no permite confirmar el guardado. Actualiza la plantilla.',
              503
            );
        }
        return result;
      } catch (error) {
        if (
          error instanceof BiwengerNetworkError ||
          (error instanceof BiwengerProviderError &&
            error.status !== undefined &&
            error.status >= 500)
        )
          throw new LineupOperationError(
            'LINEUP_SAVE_UNCONFIRMED',
            'No se pudo confirmar el guardado. Comprueba la alineación de Biwenger antes de volver a guardar.',
            503
          );
        throw error;
      }
    });
    return { status: 'completed', message: 'Alineación actualizada en Biwenger' };
  },
};
