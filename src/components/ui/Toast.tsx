'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type Notification = { id: number; message: string; tone: 'success' | 'error' };

export function useToast() {
  const [toast, setToast] = useState<Notification | null>(null);
  const sequence = useRef(0);
  const notify = useCallback((message: string, tone: Notification['tone']) => {
    setToast({ id: ++sequence.current, message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  return { toast, notify, dismissToast };
}

type ToastProps = {
  notification: Notification | null;
  onDismiss: () => void;
  anchorRef: RefObject<HTMLElement | null>;
};

function ToastNotice({
  notification,
  onDismiss,
  anchorRef,
}: ToastProps & { notification: Notification }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const remaining = useRef(notification.tone === 'error' ? 6000 : 4000);
  const paused = hovered || focused;

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [paused, onDismiss]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const update = () => {
      const box = anchor.getBoundingClientRect();
      setPosition({
        left: box.left + box.width / 2,
        // Keep feedback visible if its controls scroll outside the viewport.
        top: Math.max(144, Math.min(box.top - 12, window.innerHeight - 24)),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef]);

  const error = notification.tone === 'error';
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div
      style={position ? { left: position.left, top: position.top } : { visibility: 'hidden' }}
      className={`fixed z-[80] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-full items-center gap-3 rounded-xl border bg-surface-card py-2 pl-4 pr-2 text-sm text-content-primary shadow-lg ${error ? 'border-rose-500/60' : 'border-emerald-500/60'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Icon
        size={20}
        className={error ? 'shrink-0 text-rose-500' : 'shrink-0 text-emerald-500'}
        aria-hidden="true"
      />
      <p role={error ? 'alert' : 'status'}>{notification.message}</p>
      <button
        type="button"
        aria-label="Cerrar aviso"
        onClick={onDismiss}
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-content-secondary hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Toast({ notification, onDismiss, anchorRef }: ToastProps) {
  if (!notification) return null;
  return createPortal(
    <ToastNotice
      key={notification.id}
      notification={notification}
      onDismiss={onDismiss}
      anchorRef={anchorRef}
    />,
    document.body
  );
}
