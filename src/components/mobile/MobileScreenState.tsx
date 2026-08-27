import { AlertTriangle, Inbox, LoaderCircle, RotateCcw } from 'lucide-react';

export function MobileScreenLoading({ label = 'Cargando datos' }: { label?: string }) {
  return (
    <div className="mobile-screen-state" role="status" aria-live="polite">
      <LoaderCircle className="animate-spin" size={28} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function MobileScreenEmpty({ message = 'Todavía no hay datos para mostrar.' }: { message?: string }) {
  return (
    <div className="mobile-screen-state">
      <Inbox size={28} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function MobileScreenError({
  message = 'No hemos podido cargar esta pantalla.',
}: {
  message?: string;
}) {
  return (
    <div className="mobile-screen-state mobile-screen-state-error" role="alert">
      <AlertTriangle size={28} aria-hidden="true" />
      <p>{message}</p>
      <button type="button" onClick={undefined} className="mobile-retry-button">
        <RotateCcw size={17} aria-hidden="true" /> Reintentar
      </button>
    </div>
  );
}
