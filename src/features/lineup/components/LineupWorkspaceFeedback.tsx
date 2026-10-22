'use client';
import Link from 'next/link';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { ModalDialog } from '@/components/ui/controls/ModalDialog';
import { Toast } from '@/components/ui/Toast';
import type { useLineupWorkspace } from '../hooks/useLineupWorkspace';

export function LineupWorkspaceFeedback({
  workspace,
  toastAnchorRef,
}: {
  workspace: ReturnType<typeof useLineupWorkspace>;
  toastAnchorRef: RefObject<HTMLElement | null>;
}) {
  const { issue, review } = workspace;
  const reconnect = issue?.code === 'BIWENGER_RECONNECT_REQUIRED';
  const unconfirmed = issue?.code === 'LINEUP_SAVE_UNCONFIRMED';
  return (
    <>
      <Toast
        notification={workspace.toast}
        onDismiss={workspace.dismissToast}
        anchorRef={toastAnchorRef}
      />
      {issue && !review && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-default bg-surface-card p-3 text-sm text-content-primary">
          <p>
            {issue.status === 401
              ? 'Inicia sesión para continuar'
              : reconnect
                ? 'Renueva tu conexión'
                : unconfirmed
                  ? 'Comprueba tu alineación'
                  : 'Actualiza tu plantilla'}
          </p>
          {issue.status === 401 ? (
            <Link href="/login" className="underline">
              Iniciar sesión
            </Link>
          ) : reconnect ? (
            <Link href="/settings/biwenger" className="underline">
              Renovar conexión con Biwenger
            </Link>
          ) : (
            <span className="text-content-secondary">Usa Actualizar plantilla para continuar</span>
          )}
        </div>
      )}
      {review &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
            <ModalDialog
              aria-label="Revisar plantilla actualizada"
              onClose={workspace.dismissReview}
              className="w-full max-w-md space-y-4 rounded-xl border border-border-default bg-surface-card p-5 text-content-primary"
            >
              <h2 className="text-lg font-semibold">Tu plantilla ha cambiado</h2>
              <p className="text-sm">Elige cómo continuar con tus cambios sin guardar.</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg border border-border-default p-3"
                  onClick={() => workspace.applyReview(false)}
                >
                  Cargar última alineación
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg bg-primary p-3 text-white"
                  onClick={() => workspace.applyReview(true)}
                >
                  Conservar mis cambios
                </button>
                <button
                  type="button"
                  className="cursor-pointer p-2"
                  onClick={workspace.dismissReview}
                >
                  Cancelar
                </button>
              </div>
            </ModalDialog>
          </div>,
          document.body
        )}
    </>
  );
}
