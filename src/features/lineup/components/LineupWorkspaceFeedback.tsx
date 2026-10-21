'use client';
import Link from 'next/link';
import type { ApiError } from '@/lib/api-error';

export function LineupWorkspaceFeedback({
  checkedAt,
  error,
  success,
  issue,
  review,
  loading,
  dirty,
  onRefresh,
  onReview,
}: {
  checkedAt?: string;
  error: string | null;
  success: string | boolean;
  issue: ApiError | null;
  review: boolean;
  loading: boolean;
  dirty: boolean;
  onRefresh: () => void;
  onReview: (keep: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border-default bg-surface-card p-4 text-sm text-content-primary">
      {error && <p role="alert">{error}</p>}
      {issue?.reference && <p>Referencia: {issue.reference}</p>}
      {issue?.details?.affectedSlotIndexes?.length ? (
        <p>
          Posiciones afectadas: {issue.details.affectedSlotIndexes.map((i) => i + 1).join(', ')}.
        </p>
      ) : null}
      {success && (
        <p role="status">{typeof success === 'string' ? success : 'Operación completada.'}</p>
      )}
      {checkedAt && (
        <p>
          Plantilla comprobada en Biwenger a las {new Date(checkedAt).toLocaleTimeString('es-ES')}.
        </p>
      )}
      {dirty && <p>Cambios sin guardar.</p>}
      {review && (
        <div role="region" aria-label="Revisar plantilla actualizada" className="space-y-2">
          <p>
            Hay una nueva versión de tu plantilla. Elige cómo continuar; no se guardará ningún
            cambio automáticamente.
          </p>
          <button
            type="button"
            className="cursor-pointer rounded border p-2"
            onClick={() => onReview(false)}
          >
            Cargar última alineación
          </button>{' '}
          <button
            type="button"
            className="cursor-pointer rounded border p-2"
            onClick={() => onReview(true)}
          >
            Conservar cambios y actualizar plantilla
          </button>
        </div>
      )}
      {issue?.code === 'BIWENGER_RECONNECT_REQUIRED' ? (
        <Link href="/settings/biwenger" className="underline">
          Renovar conexión con Biwenger
        </Link>
      ) : null}
      {issue?.status === 401 && (
        <Link href="/login" className="underline">
          Iniciar sesión
        </Link>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={onRefresh}
        className="cursor-pointer rounded border p-2 disabled:opacity-50"
      >
        Actualizar plantilla
      </button>
    </div>
  );
}
