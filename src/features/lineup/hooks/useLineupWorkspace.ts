'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { normalizeLineupConfig, type TacticalLineup } from '../logic/lineup';
import { lineupFingerprint } from '../logic/draft';
import { enrichLineupSquad } from '../logic/squad';
import type { LineupWorkspace } from '../models/workspace';

export function useLineupWorkspace(userId: string | number) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | boolean>(false);
  const [workspace, setWorkspace] = useState<LineupWorkspace | null>(null);
  const [review, setReview] = useState<LineupWorkspace | null>(null);
  const [squad, setSquad] = useState<
    ReturnType<typeof enrichLineupSquad<LineupWorkspace['players'][number]>>
  >([]);
  const [lineupConfig, setLineupConfig] = useState<TacticalLineup>(normalizeLineupConfig());
  const operation = useRef(0);
  const busy = useRef(false);
  const draftRef = useRef(lineupConfig);
  draftRef.current = lineupConfig;
  const dirty = Boolean(workspace && lineupFingerprint(lineupConfig) !== workspace.baseline);

  const apply = useCallback((next: LineupWorkspace, keepDraft = false) => {
    setWorkspace(next);
    setSquad(enrichLineupSquad(next.players, next.provider));
    setReview(null);
    setIssue(null);
    setError(null);
    if (keepDraft) {
      const owned = new Set(next.players.map((p) => String(p.id)));
      setLineupConfig((current) => {
        const draft = normalizeLineupConfig(current);
        draft.playersID = draft.playersID.map((id) => (id !== null && !owned.has(id) ? null : id));
        draft.reservesID = draft.reservesID.map((id) =>
          id !== null && !owned.has(id) ? null : id
        );
        if (draft.captain && !draft.playersID.slice(0, 5).includes(draft.captain))
          draft.captain = null;
        return draft;
      });
      setSuccess(
        'Plantilla actualizada. Se han vaciado los puestos de jugadores que ya no tienes. Revisa tu borrador antes de guardar.'
      );
    } else {
      setLineupConfig(normalizeLineupConfig(next.provider.lineup));
      setSuccess(false);
    }
  }, []);

  const fail = (cause: unknown) => {
    setSuccess(false);
    setIssue(cause instanceof ApiError ? cause : null);
    setError(
      cause instanceof Error
        ? cause.message
        : 'No se pudo conectar con Biwenger. Conservamos tus cambios.'
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    const epoch = ++operation.current;
    setLoading(true);
    setWorkspace(null);
    setSquad([]);
    setReview(null);
    setIssue(null);
    setError(null);
    setLineupConfig(normalizeLineupConfig());
    apiClient
      .get('/api/users/lineup/workspace', { signal: controller.signal, cache: 'no-store' })
      .then((response) => {
        if (operation.current === epoch) apply(response.data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && operation.current === epoch) fail(cause);
      })
      .finally(() => {
        if (operation.current === epoch) setLoading(false);
      });
    return () => {
      controller.abort();
      operation.current = epoch + 1;
    };
  }, [userId, apply]);

  const refresh = async () => {
    if (busy.current || loading) return;
    busy.current = true;
    const epoch = operation.current;
    setLoading(true);
    try {
      const response = await apiClient.get('/api/users/lineup/workspace', { cache: 'no-store' });
      if (epoch !== operation.current) return;
      const next = response.data as LineupWorkspace;
      if (dirty && lineupFingerprint(draftRef.current) !== next.baseline) setReview(next);
      else apply(next);
    } catch (cause) {
      if (epoch === operation.current) fail(cause);
    } finally {
      busy.current = false;
      if (epoch === operation.current) setLoading(false);
    }
  };

  const save = async () => {
    if (busy.current || loading || !workspace || review || issue) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const epoch = operation.current;
    const submitted = normalizeLineupConfig(lineupConfig);
    try {
      await apiClient.saveLineup(submitted, workspace.baseline);
      if (epoch !== operation.current) return;
      setWorkspace((current) =>
        current ? { ...current, baseline: lineupFingerprint(submitted) } : current
      );
      setSuccess('Alineación guardada en Biwenger.');
    } catch (cause) {
      if (epoch !== operation.current) return;
      if (!(cause instanceof ApiError))
        fail(
          new ApiError(
            'No se pudo confirmar el guardado. Actualiza la plantilla antes de volver a guardar.',
            503,
            'LINEUP_SAVE_UNCONFIRMED'
          )
        );
      else fail(cause);
    } finally {
      busy.current = false;
      if (epoch === operation.current) setSaving(false);
    }
  };
  const edit: Dispatch<SetStateAction<TacticalLineup>> = (update) => {
    setLineupConfig(update);
    setSuccess(false);
    if (issue?.status === 422 || issue?.status === 400) {
      setIssue(null);
      setError(null);
    }
  };
  return {
    loading,
    setLoading,
    saving,
    error,
    setError,
    issue,
    success,
    setSuccess,
    squad,
    setSquad,
    lineupConfig,
    setLineupConfig: edit,
    dirty,
    save,
    refresh,
    review,
    applyReview: (keep: boolean) => review && apply(review, keep),
    checkedAt: workspace?.checkedAt,
    canSave: Boolean(workspace && !loading && !saving && !review && !issue),
  };
}
